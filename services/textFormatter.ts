/**
 * Khmer Administrative Document Formatter & Markdown Cleaner
 * Removes raw markdown symbols (#, *, **, _, `, ~) and converts
 * text into formal, clean Khmer administrative typography.
 */

export const cleanRawMarkdown = (rawText: string): string => {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove markdown header prefixes (e.g., "# ", "## ", "### ", "#### ")
  text = text.replace(/^#{1,6}\s*/gm, '');

  // 2. Remove horizontal rules like "---" or "***" or "___"
  text = text.replace(/^(\s*[-*_]\s*){3,}$/gm, '');

  // 3. Convert markdown bullet lists "* " or "+ " into standard dash "- "
  text = text.replace(/^(\s*)[*+]\s+/gm, '$1- ');

  return text;
};

export const formatToHtml = (rawText: string): string => {
  if (!rawText) return '';

  let text = cleanRawMarkdown(rawText);

  // Convert bold **text** to <span> without the asterisks
  text = text.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-gray-900">$1</span>');

  // Convert italic *text* or _text_ to normal text (removing asterisks and underscores)
  text = text.replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1$2$3');
  text = text.replace(/(^|[^_])_([^_]+)_([^_]|$)/g, '$1$2$3');

  // Remove any remaining stray asterisks, hashes, backticks, or underscores
  text = text.replace(/[*#`_~]/g, '');

  // Process line by line for structured administrative layout
  const lines = text.split('\n');
  const formattedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '<div class="h-2"></div>';

    // Roman Numeral Section (I., II., III., IV., V., VI., etc.)
    if (/^[I|V|X]+\.\s*/i.test(trimmed)) {
      return `<div class="khmer-moul mt-6 mb-2 text-base text-left text-gray-900 font-bold tracking-wide">${trimmed}</div>`;
    }

    // Numbered section (1., 2., 3., or ១., ២., ៣.)
    if (/^([0-9]+|[១-៩]+)\.\s*/.test(trimmed)) {
      return `<div class="pl-2 mt-3 mb-1 text-left font-bold text-gray-900">${trimmed}</div>`;
    }

    // Khmer alphabetical sub-bullet (ក., ខ., គ., ឃ., etc.)
    if (/^[ក-អ]\.\s*/.test(trimmed)) {
      return `<div class="pl-4 mt-2 mb-1 text-left font-semibold text-gray-800">${trimmed}</div>`;
    }

    // Dash bullet (- or +)
    if (/^-\s*/.test(trimmed)) {
      return `<div class="pl-6 mb-1 text-left text-gray-800 flex items-start"><span class="mr-2 font-bold">•</span><span>${trimmed.substring(1).trim()}</span></div>`;
    }

    // Regular paragraph
    return `<div class="mb-2 text-left leading-relaxed">${line}</div>`;
  });

  return formattedLines.join('');
};

export const formatToWordHtml = (rawText: string): string => {
  if (!rawText) return '';

  let text = cleanRawMarkdown(rawText);

  // Convert bold **text** to <b>text</b>
  text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // Remove any remaining stray asterisks, hashes, backticks, or underscores
  text = text.replace(/[*#`_~]/g, '');

  const lines = text.split('\n');
  const formattedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '<br/>';

    // Roman Numeral Section (I., II., etc.)
    if (/^[I|V|X]+\.\s*/i.test(trimmed)) {
      return `<p style="font-family: 'Moul', 'Khmer OS Muol Light', serif; margin-top: 16px; margin-bottom: 6px; font-size: 11.5pt;"><b>${trimmed}</b></p>`;
    }

    // Numbered section (1. or ១.)
    if (/^([0-9]+|[១-៩]+)\.\s*/.test(trimmed)) {
      return `<p style="font-weight: bold; margin-top: 10px; margin-bottom: 4px; font-size: 11pt; padding-left: 10px;">${trimmed}</p>`;
    }

    // Khmer letter bullet (ក., ខ., etc.)
    if (/^[ក-អ]\.\s*/.test(trimmed)) {
      return `<p style="font-weight: bold; margin-top: 6px; margin-bottom: 3px; font-size: 10.5pt; padding-left: 20px;">${trimmed}</p>`;
    }

    // Dash bullet (- )
    if (/^-\s*/.test(trimmed)) {
      return `<p style="margin-top: 3px; margin-bottom: 3px; font-size: 10.5pt; padding-left: 30px;">- ${trimmed.substring(1).trim()}</p>`;
    }

    return `<p style="margin-top: 4px; margin-bottom: 4px; font-size: 10.5pt; line-height: 1.3;">${line}</p>`;
  });

  return formattedLines.join('');
};
