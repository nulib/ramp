import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Transcript from './Transcript';
import * as transcriptParser from '@Services/transcript-parser';

describe('Transcript component', () => {
  let promise, originalError;
  beforeEach(() => {
    promise = Promise.resolve();
    originalError = console.error;
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  describe('with valid transcript data', () => {
    const props = {
      playerID: 'player-id',
      transcripts: [
        {
          canvasId: 0,
          items: [
            {
              title: 'Transcript 1',
              url: 'http://example.com/transcript.json',
            },
          ],
        },
      ],
    };

    describe('with timed-text', () => {
      let parseTranscriptMock;
      beforeEach(async () => {
        const parsedData = {
          tData: [
            {
              begin: 1.2,
              end: 21,
              text: '[music]',
            },
            {
              begin: 22.2,
              end: 26.6,
              text: 'transcript text 1',
            },
            {
              begin: 27.3,
              end: 31,
              text: '<strong>transcript text 2</strong>',
            },
          ],
          tUrl: 'http://example.com/transcript.json',
          tType: transcriptParser.TRANSCRIPT_TYPES.timedText,
          tFileExt: 'json',
        };
        parseTranscriptMock = jest
          .spyOn(transcriptParser, 'parseTranscriptData')
          .mockReturnValue(parsedData);

        render(
          <React.Fragment>
            <video id="player-id" />
            <Transcript {...props} />
          </React.Fragment>
        );
        await act(() => promise);
      });
      test('renders successfully', async () => {
        await waitFor(() => {
          expect(parseTranscriptMock).toHaveBeenCalledTimes(1);
          expect(screen.queryByTestId('transcript_content_1')).toBeInTheDocument();
          expect(
            screen.queryAllByTestId('transcript_time')[0]
          ).toHaveTextContent('00:01');
          expect(screen.queryAllByTestId('transcript_text')[0]).toHaveTextContent(
            '[music]'
          );
          const transcriptItem = screen.queryAllByTestId('transcript_item')[0];
          expect(transcriptItem).toHaveAttribute('starttime');
          expect(transcriptItem).toHaveAttribute('endtime');
        });
      });

      test('renders html markdown text', async () => {
        await waitFor(() => {
          const transcriptText = screen.queryAllByTestId('transcript_text')[2];
          expect(transcriptText.innerHTML).toEqual(
            '<strong>transcript text 2</strong>'
          );
          expect(transcriptText).toHaveTextContent('transcript text 2');
        });
      });

      test('highlights transcript item on click', async () => {
        await waitFor(() => {
          const transcriptItem = screen.queryAllByTestId('transcript_item')[0];
          fireEvent.click(transcriptItem);
          expect(transcriptItem.classList.contains('active')).toBeTruthy();
        });
      });
    });

    describe('non timed-text', () => {
      let parseTranscriptMock;
      beforeEach(async () => {
        const parsedData = {
          tData: [
            {
              begin: null,
              end: null,
              text: '[music]',
            },
            {
              begin: null,
              end: null,
              text: 'transcript text 1',
            },
            {
              begin: null,
              end: null,
              text: '<strong>transcript text 2</strong>',
            },
          ],
          tUrl: 'http://example.com/transcript.json',
          tType: transcriptParser.TRANSCRIPT_TYPES.timedText,
          tFileExt: 'json',
        };
        parseTranscriptMock = jest
          .spyOn(transcriptParser, 'parseTranscriptData')
          .mockReturnValue(parsedData);

        render(
          <React.Fragment>
            <video id="player-id" />
            <Transcript {...props} />
          </React.Fragment>
        );
        await act(() => promise);
      });

      test('renders successfully', async () => {
        await waitFor(() => {
          expect(parseTranscriptMock).toHaveBeenCalledTimes(1);
          expect(screen.queryByTestId('transcript_content_1')).toBeInTheDocument();
          expect(screen.queryByTestId('transcript_time')).not.toBeInTheDocument();
          expect(screen.queryAllByTestId('transcript_text')[0]).toHaveTextContent(
            '[music]'
          );
          const transcriptItem = screen.queryAllByTestId('transcript_item')[0];
          expect(transcriptItem).not.toHaveAttribute('starttime');
          expect(transcriptItem).not.toHaveAttribute('endtime');
        });
      });

      test('highlights item on click', async () => {
        await waitFor(() => {
          const transcriptItem = screen.queryAllByTestId('transcript_item')[0];
          fireEvent.click(transcriptItem);
          expect(transcriptItem.classList.contains('active')).toBeTruthy();
        });
      });

      test('removes previous item highlight on click', async () => {
        await waitFor(() => {
          // click on an item
          const transcriptItem1 = screen.queryAllByTestId('transcript_item')[0];
          fireEvent.click(transcriptItem1);
          expect(transcriptItem1.classList.contains('active')).toBeTruthy();

          const transcriptItem2 = screen.queryAllByTestId('transcript_item')[1];
          // click on a second item
          fireEvent.click(transcriptItem2);
          expect(transcriptItem2.classList.contains('active')).toBeTruthy();
          expect(transcriptItem1.classList.contains('active')).toBeFalsy();
        });
      });
    });

    describe('renders plain text', () => {
      test('in a MS docs file', async () => {
        const originalError = console.error.bind(console.error);
        console.error = jest.fn();
        const props = {
          playerID: 'player-id',
          transcripts: [
            {
              canvasId: 0,
              items: [
                {
                  title: 'MS doc transcript',
                  url: 'http://example.com/transcript.doc',
                },
              ],
            },
          ],
        };
        const parsedData = {
          tData: [
            '<p><strong>Speaker 1:</strong> <em>Lorem ipsum</em> dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Etiam non quam lacus suspendisse faucibus interdum posuere. </p>',
          ],
          tUrl: 'http://example.com/transcript.doc',
          tType: transcriptParser.TRANSCRIPT_TYPES.doc,
          tFileExt: 'doc',
        };
        const parseTranscriptMock = jest
          .spyOn(transcriptParser, 'parseTranscriptData')
          .mockReturnValue(parsedData);

        render(
          <React.Fragment>
            <video id="player-id" />
            <Transcript {...props} />
          </React.Fragment>
        );
        await act(() => promise);

        await waitFor(() => {
          expect(parseTranscriptMock).toHaveBeenCalledTimes(1);
          expect(screen.queryByTestId('transcript_nav')).toBeInTheDocument();
          expect(screen.queryByTestId('transcript_content_3')).toBeInTheDocument();
          console.error = originalError;
        });
      });

      test('in a plain text file', async () => {
        const props = {
          playerID: 'player-id',
          transcripts: [
            {
              canvasId: 0,
              items: [
                {
                  title: 'Plain text transcript',
                  url: 'http://example.com/transcript.txt',
                },
              ],
            },
          ],
        };
        const parsedData = {
          tData: ["1<br>00:00:01.200 --&gt; 00:00:21.000<br>[music]<br><br>2<br>00:00:22.200 --&gt; 00:00:26.600<br>Just before lunch one day, a puppet show <br>was put on at school.<br><br>3<br>00:00:26.700 --&gt; 00:00:31.500<br>It was called \"Mister Bungle Goes to Lunch\".<br><br>"],
          tUrl: 'http://example.com/transcript.txt',
          tType: transcriptParser.TRANSCRIPT_TYPES.plainText,
          tFileExt: 'txt',
        };
        const parseTranscriptMock = jest
          .spyOn(transcriptParser, 'parseTranscriptData')
          .mockReturnValue(parsedData);

        render(
          <React.Fragment>
            <video id="player-id" />
            <Transcript {...props} />
          </React.Fragment>
        );
        await act(() => promise);

        await waitFor(() => {
          expect(parseTranscriptMock).toHaveBeenCalledTimes(1);
          expect(screen.queryByTestId('transcript_nav')).toBeInTheDocument();
          expect(screen.queryByTestId('transcript_content_2')).toBeInTheDocument();
        });
      });
    });
  });

  describe('renders a message with invalid transcript data', () => {
    test('empty list of transcripts', () => {
      render(<Transcript playerID="player-id" transcripts={[]} />);
      expect(screen.queryByTestId('transcript_nav')).toBeInTheDocument();
      expect(screen.queryByTestId('transcript_content_0')).toBeInTheDocument();
      expect(screen.queryByTestId('no-transcript')).toBeInTheDocument();
      expect(screen.getByTestId('no-transcript')).toHaveTextContent(
        'No valid Transcript(s) found, please check again'
      );
    });

    test('empty transcript item list', async () => {
      const props = {
        playerID: 'player-id',
        transcripts: [
          {
            canvasId: 0,
            items: [],
          },
        ],
      };
      render(
        <React.Fragment>
          <video id="player-id" />
          <Transcript {...props} />
        </React.Fragment>
      );
      await act(() => promise);
      expect(screen.queryByTestId('transcript-selector')).not.toBeInTheDocument();
      expect(screen.queryByTestId('transcript_content_0')).toBeInTheDocument();
      expect(screen.queryByTestId('no-transcript')).toBeInTheDocument();
      expect(screen.getByTestId('no-transcript')).toHaveTextContent(
        'No valid Transcript(s) found, please check again'
      );
    });

    test('undefined transcript url', async () => {
      const props = {
        playerID: 'player-id',
        transcripts: [
          {
            canvasId: 0,
            items: [
              {
                title: 'Transcript 0',
                url: undefined,
              },
            ],
          },
        ],
      };
      const parsedData = {
        tData: [],
        tUrl: undefined,
        tType: transcriptParser.TRANSCRIPT_TYPES.invalid,
      };
      const parseTranscriptMock = jest
        .spyOn(transcriptParser, 'parseTranscriptData')
        .mockReturnValue(parsedData);
      render(
        <React.Fragment>
          <video id="player-id" />
          <Transcript {...props} />
        </React.Fragment>
      );
      await act(() => promise);
      await waitFor(() => {
        expect(parseTranscriptMock).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('transcript_content_-1')).toBeInTheDocument();
        expect(screen.queryByTestId('no-transcript')).toBeInTheDocument();
        expect(screen.getByTestId('no-transcript')).toHaveTextContent(
          'Invalid URL for transcript, please check again.'
        );
      });
    });

    test('invalid transcript url', async () => {
      const props = {
        playerID: 'player-id',
        transcripts: [
          {
            canvasId: 0,
            items: [
              {
                title: 'Transcript 1',
                url: 'www.example.com/transcript.json',
              },
            ],
          },
        ],
      };

      const parsedData = {
        tData: [],
        tUrl: 'www.example.com/transcript.json',
        tType: transcriptParser.TRANSCRIPT_TYPES.invalid,
      };
      const parseTranscriptMock = jest
        .spyOn(transcriptParser, 'parseTranscriptData')
        .mockReturnValue(parsedData);

      render(
        <React.Fragment>
          <video id="player-id" />
          <Transcript {...props} />
        </React.Fragment>
      );
      await act(() => promise);
      await waitFor(() => {
        expect(parseTranscriptMock).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('transcript_content_-1')).toBeInTheDocument();
        expect(screen.queryByTestId('no-transcript')).toBeInTheDocument();
        expect(screen.getByTestId('no-transcript')).toHaveTextContent(
          'Invalid URL for transcript, please check again.'
        );
      });
    });

    test('invalid transcript file type: .png', async () => {
      const props = {
        playerID: 'player-id',
        transcripts: [
          {
            canvasId: 0,
            items: [
              {
                title: 'Image Transcript',
                url: 'https://example.com/transcript_image.png',
              },
            ],
          },
        ],
      };
      const sanitizeTranscriptsMock = jest
        .spyOn(transcriptParser, 'sanitizeTranscripts')
        .mockReturnValue([{
          title: 'Image transcript - no transcript',
          id: 'Image transcript - no transcript-0-0',
          isMachineGen: false,
          url: 'https://example.com/transcript_image.png'
        }]);

      render(
        <React.Fragment>
          <video id="player-id" />
          <Transcript {...props} />
        </React.Fragment>
      );
      await act(() => promise);

      await waitFor(() => {
        expect(sanitizeTranscriptsMock).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('transcript_content_0')).toBeInTheDocument();
        expect(screen.queryByTestId('no-transcript')).toBeInTheDocument();
        expect(screen.getByTestId('no-transcript')).toHaveTextContent(
          'No valid Transcript(s) found, please check again'
        );
      });
    });

    test('manifest without supplementing motivation', async () => {
      const props = {
        playerID: 'player-id',
        transcripts: [
          {
            canvasId: 0,
            items: [
              {
                title: 'Transcript 2',
                url: 'http://example.com/transcript-manifest.json',
              },
            ],
          },
        ],
      };

      const parsedData = {
        tData: [],
        tUrl: 'http://example.com/transcript-manifest.json',
        tType: transcriptParser.TRANSCRIPT_TYPES.noTranscript,
      };
      const parseTranscriptMock = jest
        .spyOn(transcriptParser, 'parseTranscriptData')
        .mockReturnValue(parsedData);

      render(
        <React.Fragment>
          <video id="player-id" />
          <Transcript {...props} />
        </React.Fragment>
      );
      await act(() => promise);

      await waitFor(() => {
        expect(parseTranscriptMock).toHaveBeenCalledTimes(0);
        expect(screen.queryByTestId('transcript_content_0')).toBeInTheDocument();
        expect(screen.queryByTestId('no-transcript')).toBeInTheDocument();
        expect(screen.getByTestId('no-transcript')).toHaveTextContent(
          'No valid Transcript(s) found, please check again.'
        );
      });
    });
  });

  describe('with props', () => {
    test('manifestUrl with supplementing annotations', async () => {
      const props = {
        playerID: 'player-id',
        manifestUrl: 'http://example.com/manifest.json'
      };

      const transcriptsList = [
        {
          canvasId: 0,
          items: [
            {
              title: 'WebVTT Transcript',
              id: 'WebVTT Transcript-0-0',
              url: 'http://example.com/webvtt-transcript.vtt',
              isMachineGen: false,
            }
          ]
        },
        {
          canvasId: 1,
          items: []
        },
        {
          canvasId: 2,
          items: [
            {
              title: 'MS Doc',
              id: 'MS Doc-2-0',
              url: 'http://example.com/ms-doc.docx',
              isMachineGen: true
            }
          ]
        }
      ];
      const getSupplementingAnnotationsMock = jest
        .spyOn(transcriptParser, 'getSupplementingAnnotations')
        .mockReturnValue(transcriptsList);

      const parseTranscriptMock = jest
        .spyOn(transcriptParser, 'parseTranscriptData')
        .mockReturnValue({
          tData: [{ begin: 1.2, end: 21, text: '[music]' }, { begin: 22.2, end: 26.6, text: 'transcript text 1' }],
          tUrl: 'http://example.com/webvtt-transcript.vtt',
          tType: transcriptParser.TRANSCRIPT_TYPES.timedText,
          tFileExt: 'vtt',
        });

      render(
        <React.Fragment>
          <video id="player-id" />
          <Transcript {...props} />
        </React.Fragment>
      );
      await act(() => promise);

      await waitFor(() => {
        expect(getSupplementingAnnotationsMock).toHaveBeenCalledTimes(1);
        expect(parseTranscriptMock).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('transcript-selector')).toBeInTheDocument();
        expect(screen.queryByTestId('transcript_content_1')).toBeInTheDocument();
        expect(screen.queryByTestId('no-transcript')).not.toBeInTheDocument();
        expect(
          screen.queryAllByTestId('transcript_time')[0]
        ).toHaveTextContent('00:01');
        expect(screen.queryAllByTestId('transcript_text')[0]).toHaveTextContent(
          '[music]'
        );
      });
    });

    test('manifestUrl without supplementing annotations', async () => {
      const props = {
        playerID: 'player-id',
        manifestUrl: 'http://example.com/manifest.json'
      };

      const getSupplementingAnnotationsMock = jest
        .spyOn(transcriptParser, 'getSupplementingAnnotations')
        .mockReturnValue([]);

      const parseTranscriptMock = jest
        .spyOn(transcriptParser, 'parseTranscriptData')
        .mockReturnValue({});

      render(
        <React.Fragment>
          <video id="player-id" />
          <Transcript {...props} />
        </React.Fragment>
      );
      await act(() => promise);

      await waitFor(() => {
        expect(getSupplementingAnnotationsMock).toHaveBeenCalledTimes(1);
        expect(parseTranscriptMock).not.toHaveBeenCalled();
        expect(screen.queryByTestId('transcript-selector')).not.toBeInTheDocument();
        expect(screen.queryByTestId('transcript_content_0')).toBeInTheDocument();
        expect(screen.queryByTestId('no-transcript')).toBeInTheDocument();
        expect(screen.getByTestId('no-transcript')).toHaveTextContent(
          'No valid Transcript(s) found, please check again'
        );
      });
    });

    test('manifestUrl and transcripts takes precedence', async () => {
      const props = {
        playerID: 'player-id',
        manifestUrl: 'http://example.com/manifest.json',
        transcripts: [{
          canvasId: 0,
          items: []
        }],
      };

      const getSupplementingAnnotationsMock = jest
        .spyOn(transcriptParser, 'getSupplementingAnnotations');

      render(
        <React.Fragment>
          <video id="player-id" />
          <Transcript {...props} />
        </React.Fragment>
      );
      await act(() => promise);

      await waitFor(() => {
        expect(getSupplementingAnnotationsMock).not.toHaveBeenCalled();
        expect(screen.queryByTestId('transcript-selector')).not.toBeInTheDocument();
        expect(screen.queryByTestId('transcript_content_0')).toBeInTheDocument();
        expect(screen.queryByTestId('no-transcript')).toBeInTheDocument();
        expect(screen.getByTestId('no-transcript')).toHaveTextContent(
          'No valid Transcript(s) found, please check again'
        );
      });
    });

    test('no manifestUrl and empty transcripts', async () => {
      const originalError = console.error.bind(console.error);
      console.error = jest.fn();
      const props = {
        playerID: 'player-id',
        transcripts: [],
      };

      render(
        <React.Fragment>
          <video id="player-id" />
          <Transcript {...props} />
        </React.Fragment>
      );
      await act(() => promise);

      await waitFor(() => {
        expect(screen.queryByTestId('transcript_nav')).toBeInTheDocument();
        expect(screen.queryByTestId('transcript_content_0')).toBeInTheDocument();
        expect(screen.queryByTestId('transcript-selector')).not.toBeInTheDocument();
        expect(screen.queryByTestId('transcript-downloader')).not.toBeInTheDocument();
        expect(screen.getByTestId('no-transcript')).toHaveTextContent(
          'No valid Transcript(s) found, please check again.');
        console.error = originalError;
      });
    });
  });
});
