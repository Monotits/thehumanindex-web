/**
 * Zenodo DOIs for the archived dataset.
 * CONCEPT resolves to the latest release (cite this by default);
 * RELEASES lists each archived version.
 */
export const DATASET_CONCEPT_DOI = '10.5281/zenodo.23912102';
export const DATASET_RELEASES = [
  { release: '2026-11', doi: '10.5281/zenodo.23912103', method: '2.3', zenodo: 'https://zenodo.org/records/23912103' },
] as const;
export const doiUrl = (doi: string) => `https://doi.org/${doi}`;
