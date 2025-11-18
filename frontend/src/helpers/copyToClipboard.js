export const copyToClipboard = (txt) => {
    return navigator.clipboard.writeText(txt);
}