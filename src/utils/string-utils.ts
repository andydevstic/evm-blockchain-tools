export function mergeStrings(str1: string, str2: string) {
  let merged = "";
  let maxLength = Math.max(str1.length, str2.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < str1.length) merged += str1[i]; // Add from str1
    if (i < str2.length) merged += str2[i]; // Add from str2
  }

  return merged;
}

export function splitMergedString(merged: string, len1: number, len2: number) {
  let str1 = "";
  let str2 = "";

  for (let i = 0; i < merged.length; i++) {
    if (i % 2 === 0 && str1.length < len1) {
      str1 += merged[i]; // Characters from str1 are at even positions
    } else if (str2.length < len2) {
      str2 += merged[i]; // Characters from str2 are at odd positions
    }
  }

  return { str1, str2 };
}
