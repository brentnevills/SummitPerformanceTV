/**
 * Utility to extract clean 11-character YouTube Video IDs from any YouTube URL format,
 * including watch URLs, live streams, shorts, embed links, and shortened links.
 */
export function extractYouTubeId(input: string): string {
  if (!input) return 'dJ9A_A4U3Xg';
  let str = input.trim();

  // Extract from full URLs with query parameters or path segments
  if (str.includes('watch?v=')) {
    str = str.split('watch?v=')[1].split('&')[0].split('?')[0];
  } else if (str.includes('v=')) {
    str = str.split('v=')[1].split('&')[0].split('?')[0];
  } else if (str.includes('youtu.be/')) {
    str = str.split('youtu.be/')[1].split('?')[0].split('&')[0];
  } else if (str.includes('youtube.com/live/')) {
    str = str.split('youtube.com/live/')[1].split('?')[0].split('&')[0];
  } else if (str.includes('youtube.com/embed/')) {
    str = str.split('youtube.com/embed/')[1].split('?')[0].split('&')[0];
  } else if (str.includes('youtube.com/shorts/')) {
    str = str.split('youtube.com/shorts/')[1].split('?')[0].split('&')[0];
  } else if (str.includes('youtube.com/v/')) {
    str = str.split('youtube.com/v/')[1].split('?')[0].split('&')[0];
  }

  // Strip trailing slashes or hash symbols
  str = str.split('/')[0].split('#')[0].split('?')[0];
  return str || 'dJ9A_A4U3Xg';
}
