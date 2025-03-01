export interface Paper {
    id: string;
    title: string;
    authors: string[];
    abstract: string;
    categories: string[];
    publishedDate: string;
    updatedDate: string;
    url: string;
    tag?: string;
    pdfPath?: string;
    sourcePath?: string;
    bibtexPath?: string;
    bibtex?: string;
    downloadDate?: string;
}
export interface PapersResponse {
    papers: Paper[];
}
export interface BibtexResponse {
    bibtex: string;
}
export interface BibtexRequest {
    paperIds: string[];
}
