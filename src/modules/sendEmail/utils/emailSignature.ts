function mergeStyles(existingStyle: string | undefined, injectedStyles: string[]) {
  const normalizedExisting = (existingStyle || '').trim().replace(/;+\s*$/, '');
  const additions = injectedStyles.join('; ');

  if (!normalizedExisting) {
    return `${additions};`;
  }

  return `${normalizedExisting}; ${additions};`;
}

export function normalizeSignatureImagesLeftAligned(signatureHtml: string) {
  if (!signatureHtml) return '';

  return signatureHtml.replace(/<img\b([^>]*)>/gi, (imgTag, rawAttrs) => {
    const attrs = rawAttrs || '';
    const styleMatch = attrs.match(/\sstyle=(['"])(.*?)\1/i);
    const existingStyle = styleMatch?.[2];
    const mergedStyle = mergeStyles(existingStyle, [
      'display: block',
      'margin: 0 !important',
      'float: none',
    ]);

    let nextAttrs = styleMatch
      ? attrs.replace(/\sstyle=(['"])(.*?)\1/i, ` style="${mergedStyle}"`)
      : `${attrs} style="${mergedStyle}"`;

    if (/\salign=/i.test(nextAttrs)) {
      nextAttrs = nextAttrs.replace(/\salign=(['"])(.*?)\1/i, ' align="left"');
    } else {
      nextAttrs = `${nextAttrs} align="left"`;
    }

    return `<img${nextAttrs}>`;
  });
}
