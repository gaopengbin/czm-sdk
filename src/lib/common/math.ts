export function isNumeric(value: any): boolean {
    return !isNaN(parseFloat(value)) && !isNaN(value);
}