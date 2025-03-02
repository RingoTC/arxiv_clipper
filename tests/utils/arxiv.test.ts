import { extractArxivId, getPaperMetadata } from '../../src/utils/arxiv';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('arxiv utils', () => {
  describe('extractArxivId', () => {
    test('extracts ID from plain ID string', () => {
      expect(extractArxivId('2101.12345')).toBe('2101.12345');
    });

    test('extracts ID from abs URL', () => {
      expect(extractArxivId('https://arxiv.org/abs/2101.12345')).toBe('2101.12345');
    });

    test('extracts ID from PDF URL', () => {
      expect(extractArxivId('https://arxiv.org/pdf/2101.12345')).toBe('2101.12345');
    });

    test('extracts ID from URL with version', () => {
      expect(extractArxivId('https://arxiv.org/abs/2101.12345v2')).toBe('2101.12345');
    });

    test('throws error for invalid input', () => {
      expect(() => extractArxivId('invalid-input')).toThrow('Invalid arXiv URL or ID');
    });
  });

  describe('getPaperMetadata', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('parses paper metadata correctly', async () => {
      // Mock API response
      const mockApiResponse = `
        <feed xmlns="http://www.w3.org/2005/Atom">
          <entry>
            <title>Test Paper Title</title>
            <id>http://arxiv.org/abs/2101.12345</id>
            <published>2021-01-25T00:00:00Z</published>
            <updated>2021-01-26T00:00:00Z</updated>
            <summary>This is a test abstract.</summary>
            <author>
              <name>Author One</name>
            </author>
            <author>
              <name>Author Two</name>
            </author>
            <category term="cs.AI" scheme="http://arxiv.org/schemas/atom"/>
            <link href="https://arxiv.org/abs/2101.12345" rel="alternate" type="text/html"/>
            <link title="pdf" href="http://arxiv.org/pdf/2101.12345" rel="related" type="application/pdf"/>
          </entry>
        </feed>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: mockApiResponse });

      const paper = await getPaperMetadata('2101.12345');

      expect(paper).toMatchObject({
        id: '2101.12345',
        title: 'Test Paper Title',
        authors: ['Author One', 'Author Two'],
        abstract: 'This is a test abstract.',
        categories: ['cs.AI'],
        publishedDate: '2021-01-25T00:00:00Z',
        updatedDate: '2021-01-26T00:00:00Z',
        url: 'https://arxiv.org/abs/2101.12345',
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://export.arxiv.org/api/query?id_list=2101.12345'
      );
    });

    test('handles API error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

      await expect(getPaperMetadata('2101.12345')).rejects.toThrow('API error');
    });
  });
}); 