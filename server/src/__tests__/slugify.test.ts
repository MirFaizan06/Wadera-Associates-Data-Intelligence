import slugify from '../utils/slugify';

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('oil prices')).toBe('oil-prices');
  });

  it('removes special characters', () => {
    expect(slugify('Oil & Gas Prices!')).toBe('oil-gas-prices');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('oil---prices')).toBe('oil-prices');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  oil prices  ')).toBe('oil-prices');
  });

  it('handles numbers', () => {
    expect(slugify('Top 10 Datasets 2024')).toBe('top-10-datasets-2024');
  });

  it('handles already-slugified strings', () => {
    expect(slugify('global-oil-prices')).toBe('global-oil-prices');
  });
});
