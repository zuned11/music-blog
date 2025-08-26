// Jest setup file for global test configuration

// Mock ffprobe command to avoid dependency on external binary
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Global test timeout
jest.setTimeout(10000);

// Add any global test utilities here
global.mockFLACMetadata = {
  format: {
    size: "12345678",
    duration: "247.5",
    bit_rate: "1411200",
    tags: {
      TITLE: "Test Song",
      ARTIST: "Test Artist",
      ALBUM: "Test Album",
      DATE: "2024",
      GENRE: "Electronic"
    }
  },
  streams: [{
    sample_rate: "44100",
    channels: 2,
    bits_per_sample: 16
  }]
};