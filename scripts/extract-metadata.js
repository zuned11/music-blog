#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Supported audio formats and their extensions
 */
const SUPPORTED_FORMATS = {
    '.flac': { format: 'FLAC', mime: 'audio/flac' },
    '.mp3': { format: 'MP3', mime: 'audio/mpeg' },
    '.wav': { format: 'WAV', mime: 'audio/wav' },
    '.aif': { format: 'AIFF', mime: 'audio/aiff' },
    '.aiff': { format: 'AIFF', mime: 'audio/aiff' },
    '.ogg': { format: 'OGG', mime: 'audio/ogg' },
    '.m4a': { format: 'M4A', mime: 'audio/mp4' },
    '.aac': { format: 'AAC', mime: 'audio/aac' }
};

/**
 * Get audio format name from extension and codec info
 * @param {string} ext - File extension
 * @param {string} formatName - ffprobe format name
 * @param {string} codecName - ffprobe codec name
 * @returns {string} - Standardized format name
 */
function getAudioFormat(ext, formatName, codecName) {
    const supported = SUPPORTED_FORMATS[ext];
    if (supported) {
        return supported.format;
    }
    
    // Fallback to codec/format detection
    if (codecName) {
        if (codecName.includes('flac')) return 'FLAC';
        if (codecName.includes('mp3')) return 'MP3';
        if (codecName.includes('aac')) return 'AAC';
        if (codecName.includes('pcm')) return ext === '.wav' ? 'WAV' : 'AIFF';
        if (codecName.includes('vorbis')) return 'OGG';
    }
    
    return 'Unknown';
}

/**
 * Get MIME type for audio format
 * @param {string} format - Audio format name
 * @param {string} ext - File extension
 * @returns {string} - MIME type
 */
function getAudioMimeType(format, ext) {
    const supported = SUPPORTED_FORMATS[ext];
    if (supported) {
        return supported.mime;
    }
    
    // Fallback mapping
    const mimeMap = {
        'FLAC': 'audio/flac',
        'MP3': 'audio/mpeg',
        'WAV': 'audio/wav',
        'AIFF': 'audio/aiff',
        'OGG': 'audio/ogg',
        'M4A': 'audio/mp4',
        'AAC': 'audio/aac'
    };
    
    return mimeMap[format] || 'audio/mpeg';
}

/**
 * Check if file extension is supported
 * @param {string} filePath - Path to audio file
 * @returns {boolean} - Whether file is supported
 */
function isSupportedAudioFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return Object.keys(SUPPORTED_FORMATS).includes(ext);
}

/**
 * Extract metadata from audio file using ffprobe
 * Supports: FLAC, MP3, WAV, AIF/AIFF, OGG, M4A, AAC
 * @param {string} filePath - Path to audio file
 * @returns {Object} - Extracted metadata
 */
function extractAudioMetadata(filePath) {
    try {
        // Use ffprobe to extract metadata as JSON
        const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
        const output = execSync(command, { encoding: 'utf8' });
        const data = JSON.parse(output);
        
        const format = data.format || {};
        const stream = data.streams?.[0] || {};
        const tags = format.tags || {};
        
        // Detect audio format from file extension and codec
        const ext = path.extname(filePath).toLowerCase();
        const formatName = getAudioFormat(ext, format.format_name, stream.codec_name);
        const mimeType = getAudioMimeType(formatName, ext);
        
        // Normalize tag keys (ffprobe uses uppercase, we want lowercase)
        const normalizedTags = {};
        Object.entries(tags).forEach(([key, value]) => {
            normalizedTags[key.toLowerCase()] = value;
        });
        
        return {
            // File information
            filename: path.basename(filePath),
            fileSize: parseInt(format.size) || 0,
            duration: parseFloat(format.duration) || 0,
            bitrate: parseInt(format.bit_rate) || 0,
            
            // Format information
            format: formatName,
            mimeType: mimeType,
            extension: ext,
            
            // Audio stream information
            sampleRate: parseInt(stream.sample_rate) || 0,
            channels: stream.channels || 2,
            bitDepth: stream.bits_per_sample || (formatName === 'MP3' ? null : 16),
            
            // Metadata tags
            title: normalizedTags.title || path.basename(filePath, ext),
            artist: normalizedTags.artist || normalizedTags.albumartist || 'Unknown Artist',
            album: normalizedTags.album || 'Unknown Album',
            date: normalizedTags.date || normalizedTags.year || new Date().getFullYear().toString(),
            genre: normalizedTags.genre ? normalizedTags.genre.split(/[,;]/).map(g => g.trim()) : ['Unknown'],
            track: normalizedTags.track || normalizedTags.tracknumber || '1',
            
            // Optional metadata
            composer: normalizedTags.composer,
            performer: normalizedTags.performer,
            comment: normalizedTags.comment,
            description: normalizedTags.description,
            
            // All original tags for reference
            allTags: normalizedTags
        };
    } catch (error) {
        console.error(`Error extracting metadata from ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Parse existing markdown file to extract frontmatter
 * @param {string} filePath - Path to existing markdown file
 * @returns {Object|null} - Parsed frontmatter or null if file doesn't exist
 */
function parseExistingMarkdown(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        
        if (!match) {
            return null;
        }
        
        return yaml.parse(match[1]);
    } catch (error) {
        console.warn(`Warning: Could not parse existing markdown file ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Check if audio file is newer than markdown file
 * @param {string} audioPath - Path to audio file
 * @param {string} markdownPath - Path to markdown file
 * @returns {boolean} - Whether audio file needs processing
 */
function shouldUpdateFile(audioPath, markdownPath, forceUpdate = false) {
    if (forceUpdate) {
        return true;
    }
    
    if (!fs.existsSync(markdownPath)) {
        return true;
    }
    
    const audioStats = fs.statSync(audioPath);
    const markdownStats = fs.statSync(markdownPath);
    
    return audioStats.mtime > markdownStats.mtime;
}

/**
 * Format date to ISO format (YYYY-MM-DD)
 * @param {string|Date} dateInput - Date input
 * @returns {string} - ISO formatted date
 */
function formatToISODate(dateInput) {
    if (!dateInput) {
        return new Date().toISOString().split('T')[0];
    }
    
    // If it's already a proper ISO date, return as-is
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
    }
    
    // If it's just a year, use January 1st of that year
    if (typeof dateInput === 'string' && /^\d{4}$/.test(dateInput)) {
        return `${dateInput}-01-01`;
    }
    
    // Try to parse as date
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            return new Date().toISOString().split('T')[0];
        }
        return date.toISOString().split('T')[0];
    } catch (error) {
        return new Date().toISOString().split('T')[0];
    }
}

/**
 * Generate markdown file from metadata
 * @param {Object} metadata - Extracted metadata
 * @param {string} outputDir - Output directory for markdown file
 * @param {boolean} forceUpdate - Force update even if file exists
 */
function generateMarkdownFile(metadata, outputDir, forceUpdate = false) {
    if (!metadata) return null;
    
    // Create slug from title
    const slug = metadata.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `${slug}.md`);
    const audioPath = path.join(path.dirname(outputDir), '../../music-files', metadata.filename);
    
    // Check if file needs updating
    if (!shouldUpdateFile(audioPath, outputPath, forceUpdate)) {
        console.log(`Skipped (unchanged): ${outputPath}`);
        return outputPath;
    }
    
    // Parse existing markdown to preserve important fields
    const existingData = parseExistingMarkdown(outputPath);
    
    // Prepare frontmatter with preservation logic
    const frontmatter = {
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        // Preserve existing date if it exists and is more specific than extracted date
        date: existingData?.date ? 
            formatToISODate(existingData.date) : 
            formatToISODate(metadata.date),
        genre: metadata.genre,
        duration: Math.round(metadata.duration),
        fileSize: metadata.fileSize,
        filename: metadata.filename,
        tags: ["music", ...metadata.genre.map(g => g.toLowerCase())],
        permalink: false,
        technical: {
            sampleRate: metadata.sampleRate,
            bitDepth: metadata.bitDepth,
            channels: metadata.channels === 2 ? "Stereo" : metadata.channels === 1 ? "Mono" : `${metadata.channels} channels`,
            format: metadata.format,
            mimeType: metadata.mimeType,
            bitrate: metadata.bitrate
        }
    };
    
    // Preserve existing publication fields if they exist
    if (existingData?.publishDate) {
        frontmatter.publishDate = existingData.publishDate;
    }
    if (existingData?.createdDate) {
        frontmatter.createdDate = existingData.createdDate;
    }
    
    // If this is a new file, set creation date
    if (!existingData) {
        frontmatter.createdDate = frontmatter.date;
    }
    
    // Add optional fields if they exist
    if (metadata.composer) frontmatter.composer = metadata.composer;
    if (metadata.performer) frontmatter.performer = metadata.performer;
    if (metadata.comment) frontmatter.description = metadata.comment;
    if (metadata.description) frontmatter.description = metadata.description;
    
    // Preserve existing description if it exists
    const description = existingData?.description || metadata.comment || metadata.description || 'No description available.';
    
    // Generate simplified markdown content (metadata only for centralized player)
    const yamlFrontmatter = yaml.stringify(frontmatter);
    const content = `---
${yamlFrontmatter}---

# ${metadata.title}

${metadata.artist ? `*by ${metadata.artist}*` : ''}

${description}

${metadata.album !== 'Unknown Album' ? `## Album Information\n\n**Album:** ${metadata.album}` : ''}
${metadata.composer ? `\n**Composer:** ${metadata.composer}` : ''}
${metadata.performer ? `\n**Performer:** ${metadata.performer}` : ''}

`;
    
    // Write markdown file
    fs.writeFileSync(outputPath, content);
    
    console.log(`Generated: ${outputPath}`);
    return outputPath;
}

/**
 * Format duration in seconds to MM:SS
 */
function formatDuration(seconds) {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to human readable
 */
function formatFileSize(bytes) {
    if (!bytes) return "0 B";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
}

/**
 * Process a single audio file or all supported audio files in a directory
 * Supports: FLAC, MP3, WAV, AIF/AIFF, OGG, M4A, AAC
 * @param {string} inputPath - Path to audio file or directory
 * @param {string} outputDir - Output directory for markdown files
 * @param {boolean} forceUpdate - Force update even if files exist
 */
function processFiles(inputPath, outputDir, forceUpdate = false) {
    const musicContentDir = outputDir || path.join(__dirname, '../src/content/music');
    
    if (fs.statSync(inputPath).isDirectory()) {
        // Process all supported audio files in directory
        const files = fs.readdirSync(inputPath)
            .filter(file => isSupportedAudioFile(file))
            .map(file => path.join(inputPath, file));
            
        console.log(`Found ${files.length} audio files to process...`);
        
        files.forEach(filePath => {
            console.log(`Processing: ${path.basename(filePath)}`);
            const metadata = extractAudioMetadata(filePath);
            generateMarkdownFile(metadata, musicContentDir, forceUpdate);
        });
    } else {
        // Process single file
        if (!isSupportedAudioFile(inputPath)) {
            console.error(`Unsupported file format: ${path.basename(inputPath)}`);
            console.error(`Supported formats: ${Object.keys(SUPPORTED_FORMATS).join(', ')}`);
            return;
        }
        
        console.log(`Processing: ${path.basename(inputPath)}`);
        const metadata = extractAudioMetadata(inputPath);
        generateMarkdownFile(metadata, musicContentDir, forceUpdate);
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const forceUpdate = args.includes('--force') || args.includes('-f');
    const inputPath = args.find(arg => !arg.startsWith('-'));
    const outputDirArg = args[args.indexOf(inputPath) + 1];
    const outputDir = outputDirArg && !outputDirArg.startsWith('-') ? outputDirArg : undefined;
    
    if (!inputPath || args.includes('--help') || args.includes('-h')) {
        console.log('Usage: node extract-metadata.js <audio-file-or-directory> [output-directory] [options]');
        console.log('');
        console.log('Options:');
        console.log('  --force, -f    Force update even if files exist and are up to date');
        console.log('  --help, -h     Show this help message');
        console.log('');
        console.log('Supported formats: FLAC, MP3, WAV, AIF/AIFF, OGG, M4A, AAC');
        console.log('');
        console.log('Examples:');
        console.log('  node extract-metadata.js song.flac');
        console.log('  node extract-metadata.js song.mp3 --force');
        console.log('  node extract-metadata.js ./music-files/');
        console.log('  node extract-metadata.js song.wav ./src/content/music/ --force');
        console.log('');
        console.log('Date Preservation:');
        console.log('  - Existing publication dates are preserved by default');
        console.log('  - Files are only updated if audio file is newer than markdown');
        console.log('  - Use --force to regenerate all files regardless');
        process.exit(inputPath ? 0 : 1);
    }
    
    if (!fs.existsSync(inputPath)) {
        console.error(`Error: ${inputPath} does not exist`);
        process.exit(1);
    }
    
    if (forceUpdate) {
        console.log('Force update enabled - will regenerate all files');
    } else {
        console.log('Preservation mode - will skip unchanged files and preserve existing dates');
    }
    
    processFiles(inputPath, outputDir, forceUpdate);
    console.log('Processing complete!');
}

module.exports = {
    extractAudioMetadata,
    extractFLACMetadata: extractAudioMetadata, // Backward compatibility alias
    generateMarkdownFile,
    processFiles,
    isSupportedAudioFile,
    parseExistingMarkdown,
    shouldUpdateFile,
    formatToISODate,
    SUPPORTED_FORMATS
};