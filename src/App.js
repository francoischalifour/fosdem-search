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
  connectNumericMenu,
} from 'react-instantsearch-dom';
import qs from 'qs';
import { format, formatDistanceStrict, isWithinInterval } from 'date-fns';
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

library.add(fab, faClock, faCoffee, faFilter, faTimes, faMapMarkerAlt);

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_API_KEY
);

const ToggleDay = connectRefinementList(({ items, refine }) => {
  items.sort((a, _b) => (a.label === 'Saturday' ? -1 : 1));

  return items.map(item => (
    <div key={item.label} className="ais-ToggleRefinement">
      <label className="ais-ToggleRefinement-label">
        <input
          className="ais-ToggleRefinement-checkbox"
          type="checkbox"
          checked={item.isRefined}
          onChange={() => refine(item.value)}
        />
        <span className="ais-ToggleRefinement-labeltext">
          {item.label === 'Saturday' ? 'Saturday 1st' : 'Sunday 2nd'}
        </span>
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
      setIsPanelHidden(true);
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
          <a href="https://github.com/francoischalifour/fosdem-search">
            GitHub
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

        <div className="max-w-5xl p-4 m-auto mb-4">
          <div className="flex -mx-2">
            <aside
              className={`w-full md:w-1/4 md:block ${
                isPanelHidden ? 'hidden' : ''
              }`}
              style={{ minWidth: 200 }}
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
                    attribute="day"
                    defaultRefinement={['Saturday', 'Sunday']}
                  />
                </Panel>

                <Panel header="Track">
                  <RefinementList
                    attribute="track"
                    searchable
                    showMore
                    showMoreLimit={100}
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
                    attribute="speaker"
                    searchable
                    showMore
                    showMoreLimit={100}
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
        style={{ bottom: '1rem', right: '1rem' }}
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
    </div>
  );
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
          {isWithinInterval(Date.now, { start: hit.start, end: hit.end }) && (
            <a className="text-sm bg-pink-400 py-1 px-2 ml-2" href={hit.live}>
              Live
            </a>
          )}
        </h1>
      </a>

      <a
        className="underline flex items-center"
        href={`https://fosdem.org/${hit.speaker_url}`}
      >
        {hit.github_handle && (
          <img
            src={`https://unavatar.now.sh/github/${hit.github_handle}`}
            alt={hit.speaker}
            className="rounded-full mr-4"
            style={{ width: 24, height: 24 }}
          />
        )}{' '}
        By {hit.speaker}
      </a>

      <p className="text-gray-700">
        <Snippet attribute="description" hit={hit} />
      </p>

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
