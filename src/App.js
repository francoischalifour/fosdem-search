import React from 'react';
import algoliasearch from 'algoliasearch/lite';
import {
  InstantSearch,
  Configure,
  Highlight,
  Hits,
  Snippet,
  SearchBox,
  Panel,
  Pagination,
  RefinementList,
  ScrollTo,
  connectRefinementList,
} from 'react-instantsearch-dom';
import qs from 'qs';
import {
  format,
  formatDistanceStrict,
  isWithinInterval,
  subHours,
} from 'date-fns';
import PropTypes from 'prop-types';
import './App.css';
import { getUrlFromState, getStateFromUrl } from './router';
import { PoweredBy } from './PoweredBy';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import {
  faClock,
  faCoffee,
  faFilter,
  faTimes,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import Truncate from 'react-truncate';
import Modal from 'react-modal';

library.add(fab, faClock, faCoffee, faFilter, faTimes, faMapMarkerAlt);

Modal.setAppElement('#root');

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_API_KEY
);

const ToggleDay = connectRefinementList(({ items: actualItems, refine }) => {
  if (actualItems.length === 0) {
    return null;
  }

  const items = [
    {
      label: 'Saturday 1st morning',
      value: (
        actualItems.find(item => item.label === 'saturday morning') || {
          value: [],
        }
      ).value,
      isRefined: (
        actualItems.find(item => item.label === 'saturday morning') || {
          isRefined: false,
        }
      ).isRefined,
    },
    {
      label: 'Saturday 1st afternoon',
      value: (
        actualItems.find(item => item.label === 'saturday afternoon') || {
          value: [],
        }
      ).value,
      isRefined: (
        actualItems.find(item => item.label === 'saturday afternoon') || {
          isRefined: false,
        }
      ).isRefined,
    },
    {
      label: 'Sunday 2nd morning',
      value: (
        actualItems.find(item => item.label === 'sunday morning') || {
          value: [],
        }
      ).value,
      isRefined: (
        actualItems.find(item => item.label === 'sunday morning') || {
          isRefined: false,
        }
      ).isRefined,
    },
    {
      label: 'Sunday 2nd afternoon',
      value: (
        actualItems.find(item => item.label === 'sunday afternoon') || {
          value: [],
        }
      ).value,
      isRefined: (
        actualItems.find(item => item.label === 'sunday afternoon') || {
          isRefined: false,
        }
      ).isRefined,
    },
  ];

  return items.map(item => (
    <div key={item.label} className="ais-ToggleRefinement">
      <label className="ais-ToggleRefinement-label">
        <input
          className="ais-ToggleRefinement-checkbox"
          type="checkbox"
          checked={item.isRefined}
          onChange={() => refine(item.value)}
        />
        <span className="ais-ToggleRefinement-labeltext">{item.label}</span>
      </label>
    </div>
  ));
});

function App() {
  const [isPanelHidden, setIsPanelHidden] = React.useState(true);
  const [searchState, setSearchState] = React.useState(
    qs.parse(getStateFromUrl(window.location.search), {
      arrayLimit: 100,
      ignoreQueryPrefix: true,
    })
  );
  const [debouncedSetState, setDebouncedSetState] = React.useState(undefined);
  const [modalIsOpen, setModalIsOpen] = React.useState(false);

  const onSearchStateChange = updatedSearchState => {
    clearTimeout(debouncedSetState);

    setDebouncedSetState(
      setTimeout(() => {
        window.history.pushState(
          getUrlFromState(updatedSearchState),
          updatedSearchState
        );
      }, 400)
    );
    setSearchState(updatedSearchState);
  };

  React.useEffect(() => {
    function onResize() {
      if (window.innerWidth > 768) {
        setIsPanelHidden(true);
      }
    }

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div>
      <header className="header flex justify-between">
        <div className="flex items-center">
          <h1 className="font-normal text-xl">
            <a href="/" className="flex items-center">
              <img
                className="align-middle mr-2"
                src="fosdem_logo.svg"
                width="32px"
                alt="FOSDEM Logo"
              />
              FOSDEM'20 Search
            </a>
          </h1>
        </div>

        <div>
          <button
            className="bg-transparent text-white border-none"
            style={{
              font: 'inherit',
              cursor: 'pointer',
              outline: 0,
            }}
            onClick={() => setModalIsOpen(!modalIsOpen)}
          >
            About
          </button>

          <a href="https://github.com/francoischalifour/fosdem-search">
            <FontAwesomeIcon
              className="text-white ml-4 mr-2"
              icon={['fab', 'github']}
            />
          </a>
        </div>
      </header>

      <InstantSearch
        searchClient={searchClient}
        indexName={process.env.REACT_APP_ALGOLIA_INDEX_NAME}
        // searchState={searchState}
        // onSearchStateChange={onSearchStateChange}
        // createURL={getUrlFromState}
      >
        <Configure attributesToSnippet={['description:50']} />

        <div className="max-w-5xl p-4 m-auto mb-8">
          <div className="flex -mx-2">
            <aside
              className={`w-full md:w-1/4 md:block ${
                isPanelHidden ? 'hidden' : ''
              }`}
              style={{ minWidth: 240 }}
            >
              <div className="filters px-2 sticky overflow-auto h-screen">
                <div className="md:hidden flex justify-end">
                  <button
                    className="ais-RefinementList-showMore"
                    onClick={() =>
                      setIsPanelHidden(prevIsPanelHidden => !prevIsPanelHidden)
                    }
                  >
                    <FontAwesomeIcon className="mr-2" icon="times" />
                    Close
                  </button>
                </div>

                <Panel header="February 2020">
                  <ToggleDay
                    attribute="time_period"
                    defaultRefinement={[
                      'saturday morning',
                      'saturday afternoon',
                      'sunday morning',
                      'sunday afternoon',
                    ]}
                  />
                </Panel>

                <Panel header="Track">
                  <RefinementList
                    attribute="track"
                    searchable
                    showMore
                    showMoreLimit={100}
                    translations={{
                      placeholder: 'Search tracks',
                    }}
                  />
                </Panel>

                <Panel header="Room">
                  <RefinementList
                    attribute="room"
                    showMore
                    showMoreLimit={100}
                    transformItems={items => {
                      items.sort((a, b) => {
                        return a.label < b.label ? -1 : 1;
                      });

                      return items;
                    }}
                  />
                </Panel>

                <Panel header="Speaker">
                  <RefinementList
                    attribute="speakers"
                    searchable
                    showMore
                    showMoreLimit={100}
                    translations={{
                      placeholder: 'Search speakers',
                    }}
                  />
                </Panel>

                <div className="md:hidden">
                  <button
                    className="ais-ClearRefinements-button"
                    style={{
                      color: '#fff',
                      backgroundColor: '#bb0098',
                      backgroundImage:
                        'linear-gradient(-180deg, #d50baf, #bb0098)',
                      border: '1px solid #bb0098',
                    }}
                    onClick={() =>
                      setIsPanelHidden(prevIsPanelHidden => !prevIsPanelHidden)
                    }
                  >
                    Show results
                  </button>
                </div>
              </div>
            </aside>

            <main className={`w-full px-2 ${isPanelHidden ? '' : 'hidden'}`}>
              <ScrollTo>
                <SearchBox
                  className="mb-4"
                  translations={{
                    placeholder: 'Search conferences',
                  }}
                />

                <div className="flex justify-end mb-4">
                  <PoweredBy />
                </div>

                <Hits hitComponent={Hit} />
              </ScrollTo>

              <div className="flex justify-center my-8">
                <Pagination />
              </div>
            </main>
          </div>
        </div>
      </InstantSearch>

      <div
        className={`fixed md:hidden ${isPanelHidden ? '' : 'hidden'}`}
        style={{ bottom: '2rem', right: '2rem' }}
      >
        <button
          className="ais-ClearRefinements-button"
          style={{
            color: '#fff',
            backgroundColor: '#bb0098',
            backgroundImage: 'linear-gradient(-180deg, #d50baf, #bb0098)',
            border: '1px solid #bb0098',
            boxShadow:
              '0 7px 11px -3px rgba(35,38,59,.2), 0 2px 4px 0 rgba(35,38,59,.3)',
          }}
          onClick={() =>
            setIsPanelHidden(prevIsPanelHidden => !prevIsPanelHidden)
          }
        >
          <FontAwesomeIcon
            style={{ color: '#fff' }}
            className="text-gray-600 mr-2 "
            icon="filter"
            title="Open filters panel"
          />{' '}
          Filters
        </button>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(!modalIsOpen)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
          },
        }}
        contentLabel="About"
      >
        <button
          className="w-24 float-right bg-red-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          onClick={() => setModalIsOpen(!modalIsOpen)}
        >
          close
        </button>
        <article>
          <h1 className="mb-8">About</h1>
          <p>
            A quickly handcrafted search for 834 FOSDEM'20 talks built in
            Brussels 🧇
          </p>

          <p>
            It will helped you to browse and find the wonderful talk you want to
            assisst <a href="https://fosdem.org/2020/">on FOSDEM 2020</a>.
          </p>
          <h4>Why?</h4>

          <p>
            We were struggling to find the room and right talk we wanted to
            attend. We thought we could help the community to navigate through
            all events.
          </p>

          <h4>How?</h4>

          <p>
            The back-end used here is pretty simple. We have fine tuned the
            behavior of{' '}
            <a href="https://github.com/algolia/docsearch-scraper/">
              the DocSearch crawler{' '}
            </a>
            based <a href="https://scrapy.org/">on scrappy</a>. We have created{' '}
            <a href="https://github.com/algolia/docsearch-configs/blob/master/disabled/fosdem.json">
              a dedicated configuration
            </a>{' '}
            which helps us to extract the needed information to identify the
            talks such as the speakers, the track it belongs to, the start and
            end hours, the room where it takes place ...
          </p>
          <p>
            We needed to custom the behavior of the crawler to build an Algolia
            index in the most performing way. It ended up create its own fork of
            the DocSearch open source crawler available{' '}
            <a href="https://github.com/algolia/docsearch-scraper/tree/fosdem/">
              from the "fosdem" git branch
            </a>
            .
          </p>
          <h4>What?</h4>

          <p>
            This tool has been hacked thanks to{' '}
            <a href="https://www.algolia.com/products/instantsearch/">
              InstantSearch
            </a>
            , <a href="https://codesandbox.io/">codesandbox</a> and{' '}
            <a href="https://www.netlify.com/">Netlify</a>. This project was
            generated{' '}
            <a href="https://github.com/algolia/create-instantsearch-app">
              with create-instantsearch-app
            </a>{' '}
            <a href="https://algolia.com">by Algolia</a>.
          </p>
          <h4>When?</h4>

          <p>Basically, just the day before of FOSDEM 2020.</p>
          <h4>Who?</h4>

          <p>
            This tool has been made by
            <a href="https://community.algolia.com/docsearch/">
              {' '}
              the team behind DocSearch. The best search experience for docs,
              integrates in minutes, for free.
            </a>
          </p>
          <h3>Useful links:</h3>
          <ul>
            <li>
              <a href="https://fosdem.org/2020/practical/transportation/">
                Plan
              </a>
            </li>
            <li>
              <a href="https://twitter.com/docsearch_">Give us your feedback</a>
            </li>
            <li>
              <a href="https://github.com/francoischalifour/fosdem-search">
                GitHub of the UI
              </a>
            </li>
          </ul>
        </article>
      </Modal>
    </div>
  );
}

function Live({ hit }) {
  if (
    isWithinInterval(new Date(), {
      start: new Date(hit.start),
      end: new Date(hit.end),
    })
  ) {
    return (
      <a className="text-sm bg-pink-400 py-1 px-2 ml-2" href={hit.live}>
        Live
      </a>
    );
  }

  if (
    isWithinInterval(new Date(), {
      start: subHours(hit.start, 1),
      end: hit.end,
    })
  ) {
    return (
      <a className="text-sm bg-pink-400 py-1 px-2 ml-2" href={hit.live}>
        Live in less than 1 hour
      </a>
    );
  }

  return null;
}

function Hit({ hit }) {
  return (
    <article className="">
      <p className="italic m-0 text-fosdem">
        <Highlight attribute="track" hit={hit} />
      </p>

      <a href={hit.url}>
        <h1>
          <Highlight attribute="hierarchy.lvl0" hit={hit} />
          <Live hit={hit} />
        </h1>
      </a>

      {(hit.speakers || []).map((speaker, i) => (
        <a
          className="underline flex items-center mt-2"
          href={`https://fosdem.org/${hit.speaker_url[i]}`}
        >
          {hit.github_handle && (
            <img
              src={`https://unavatar.now.sh/github/${hit.github_handle}`}
              alt={speaker}
              className="rounded-full mr-2"
              style={{ width: 24, height: 24 }}
            />
          )}{' '}
          {speaker}
        </a>
      ))}

      {hit.twitter}

      <Truncate
        className="text-gray-700 my-4 block"
        lines={3}
        ellipsis={
          <span>
            ...{' '}
            <a class="text-fosdem" href="/link/to/article">
              Show more
            </a>
          </span>
        }
      >
        <Snippet attribute="description" hit={hit} />
      </Truncate>

      <div className="text-gray-800 mt-0 py-1 px-2 border-solid border-2 rounded border-gray-300">
        <strong>{hit.day}</strong> at <strong>{format(hit.start, 'p')}</strong>{' '}
        <FontAwesomeIcon className="text-gray-600 ml-4 mr-1" icon="clock" />
        {formatDistanceStrict(hit.start, hit.end)}
        <FontAwesomeIcon
          className="text-gray-600 ml-4 mr-1"
          icon="map-marker-alt"
        />
        Room <strong className="text-gray-800">{hit.room}</strong>
      </div>
    </article>
  );
}

Hit.propTypes = {
  hit: PropTypes.object.isRequired,
};

export default App;
