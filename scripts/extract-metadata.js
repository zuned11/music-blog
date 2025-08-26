#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Extract metadata from FLAC file using ffprobe
 * @param {string} filePath - Path to FLAC file
 * @returns {Object} - Extracted metadata
 */
function extractFLACMetadata(filePath) {
    try {
        // Use ffprobe to extract metadata as JSON
        const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
        const output = execSync(command, { encoding: 'utf8' });
        const data = JSON.parse(output);
        
        const format = data.format || {};
        const stream = data.streams?.[0] || {};
        const tags = format.tags || {};
        
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
            
            // Audio stream information
            sampleRate: parseInt(stream.sample_rate) || 0,
            channels: stream.channels || 2,
            bitDepth: stream.bits_per_sample || 16,
            
            // Metadata tags
            title: normalizedTags.title || path.basename(filePath, '.flac'),
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
            format: "FLAC",
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
            <source src="/music-files/${metadata.filename}" type="audio/flac">
            <p>Your browser doesn't support HTML5 audio. <a href="/music-files/${metadata.filename}">Download the track</a> instead.</p>
        </audio>
    </div>
    
    <div class="music-info">
        <div><strong>Duration:</strong> ${formatDuration(metadata.duration)}</div>
        <div><strong>File Size:</strong> ${formatFileSize(metadata.fileSize)}</div>
        <div><strong>Sample Rate:</strong> ${metadata.sampleRate} Hz</div>
        <div><strong>Bit Depth:</strong> ${metadata.bitDepth} bit</div>
        <div><strong>Channels:</strong> ${frontmatter.technical.channels}</div>
        <div><strong>Genre:</strong> ${metadata.genre.join(', ')}</div>
    </div>
    
    <a href="/music-files/${metadata.filename}" class="download-link" download>
        Download FLAC (${formatFileSize(metadata.fileSize)})
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
 * Process a single FLAC file or all FLAC files in a directory
 */
function processFiles(inputPath, outputDir) {
    const musicContentDir = outputDir || path.join(__dirname, '../src/content/music');
    
    if (fs.statSync(inputPath).isDirectory()) {
        // Process all FLAC files in directory
        const files = fs.readdirSync(inputPath)
            .filter(file => file.toLowerCase().endsWith('.flac'))
            .map(file => path.join(inputPath, file));
            
        console.log(`Found ${files.length} FLAC files to process...`);
        
        files.forEach(filePath => {
            console.log(`Processing: ${path.basename(filePath)}`);
            const metadata = extractFLACMetadata(filePath);
            generateMarkdownFile(metadata, musicContentDir);
        });
    } else {
        // Process single file
        console.log(`Processing: ${path.basename(inputPath)}`);
        const metadata = extractFLACMetadata(inputPath);
        generateMarkdownFile(metadata, musicContentDir);
    }
}

// CLI usage
if (require.main === module) {
    const inputPath = process.argv[2];
    const outputDir = process.argv[3];
    
    if (!inputPath) {
        console.log('Usage: node extract-metadata.js <flac-file-or-directory> [output-directory]');
        console.log('Examples:');
        console.log('  node extract-metadata.js song.flac');
        console.log('  node extract-metadata.js ./music-files/');
        console.log('  node extract-metadata.js song.flac ./src/content/music/');
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
    extractFLACMetadata,
    generateMarkdownFile,
    processFiles
};