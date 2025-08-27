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
 * Generate markdown file from metadata
 * @param {Object} metadata - Extracted metadata
 * @param {string} outputDir - Output directory for markdown file
 */
function generateMarkdownFile(metadata, outputDir) {
    if (!metadata) return null;
    
    // Create slug from title
    const slug = metadata.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    // Prepare frontmatter
    const frontmatter = {
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        date: metadata.date,
        genre: metadata.genre,
        duration: Math.round(metadata.duration),
        fileSize: metadata.fileSize,
        filename: metadata.filename,
        tags: ["music", ...metadata.genre.map(g => g.toLowerCase())],
        layout: "music",
        technical: {
            sampleRate: metadata.sampleRate,
            bitDepth: metadata.bitDepth,
            channels: metadata.channels === 2 ? "Stereo" : metadata.channels === 1 ? "Mono" : `${metadata.channels} channels`,
            format: metadata.format,
            mimeType: metadata.mimeType,
            bitrate: metadata.bitrate
        }
    };
    
    // Add optional fields if they exist
    if (metadata.composer) frontmatter.composer = metadata.composer;
    if (metadata.performer) frontmatter.performer = metadata.performer;
    if (metadata.comment) frontmatter.description = metadata.comment;
    if (metadata.description) frontmatter.description = metadata.description;
    
    // Generate markdown content
    const yamlFrontmatter = yaml.stringify(frontmatter);
    const content = `---
${yamlFrontmatter}---

# ${metadata.title}

${metadata.artist ? `*by ${metadata.artist}*` : ''}

${metadata.comment || metadata.description || 'No description available.'}

## Audio Player

<div class="music-player">
    <div class="music-controls">
        <audio controls preload="metadata">
            <source src="/music-files/${metadata.filename}" type="${metadata.mimeType}">
            <p>Your browser doesn't support HTML5 audio. <a href="/music-files/${metadata.filename}">Download the track</a> instead.</p>
        </audio>
    </div>
    
    <div class="music-info">
        <div><strong>Duration:</strong> ${formatDuration(metadata.duration)}</div>
        <div><strong>File Size:</strong> ${formatFileSize(metadata.fileSize)}</div>
        <div><strong>Format:</strong> ${metadata.format}</div>
        <div><strong>Sample Rate:</strong> ${metadata.sampleRate} Hz</div>
        ${metadata.bitDepth ? `<div><strong>Bit Depth:</strong> ${metadata.bitDepth} bit</div>` : ''}
        <div><strong>Channels:</strong> ${frontmatter.technical.channels}</div>
        <div><strong>Genre:</strong> ${metadata.genre.join(', ')}</div>
    </div>
    
    <a href="/music-files/${metadata.filename}" class="download-link" download>
        Download ${metadata.format} (${formatFileSize(metadata.fileSize)})
    </a>
</div>

${metadata.album !== 'Unknown Album' ? `## Album Information\n\n**Album:** ${metadata.album}` : ''}
${metadata.date !== new Date().getFullYear().toString() ? `\n**Release Date:** ${metadata.date}` : ''}
${metadata.composer ? `\n**Composer:** ${metadata.composer}` : ''}
${metadata.performer ? `\n**Performer:** ${metadata.performer}` : ''}
`;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write markdown file
    const outputPath = path.join(outputDir, `${slug}.md`);
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
 */
function processFiles(inputPath, outputDir) {
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
            generateMarkdownFile(metadata, musicContentDir);
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
        generateMarkdownFile(metadata, musicContentDir);
    }
}

// CLI usage
if (require.main === module) {
    const inputPath = process.argv[2];
    const outputDir = process.argv[3];
    
    if (!inputPath) {
        console.log('Usage: node extract-metadata.js <audio-file-or-directory> [output-directory]');
        console.log('');
        console.log('Supported formats: FLAC, MP3, WAV, AIF/AIFF, OGG, M4A, AAC');
        console.log('');
        console.log('Examples:');
        console.log('  node extract-metadata.js song.flac');
        console.log('  node extract-metadata.js song.mp3');
        console.log('  node extract-metadata.js ./music-files/');
        console.log('  node extract-metadata.js song.wav ./src/content/music/');
        process.exit(1);
    }
    
    if (!fs.existsSync(inputPath)) {
        console.error(`Error: ${inputPath} does not exist`);
        process.exit(1);
    }
    
    processFiles(inputPath, outputDir);
    console.log('Processing complete!');
}

module.exports = {
    extractAudioMetadata,
    extractFLACMetadata: extractAudioMetadata, // Backward compatibility alias
    generateMarkdownFile,
    processFiles,
    isSupportedAudioFile,
    SUPPORTED_FORMATS
};