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
  connectStateResults,
  connectRefinementList,
  connectNumericMenu,
} from 'react-instantsearch-dom';
import qs from 'qs';
import { format, formatDistanceStrict, isWithinInterval } from 'date-fns';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './App.css';
import { getUrlFromState, getStateFromUrl } from './router';
import { PoweredBy } from './PoweredBy';

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_API_KEY
);

const ShowPastEvents = connectNumericMenu(({ items, refine }) => {
  return items
    .filter(x => x.label !== 'All')
    .map(item => (
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
              FOSDEM Search
            </a>
          </h1>
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

        <div className="max-w-5xl p-4 m-auto">
          <div className="flex -mx-2">
            <aside className="w-1/4" style={{ minWidth: 200 }}>
              <div className="filters px-2 sticky overflow-auto h-screen">
                {/* <Panel>
                  <ShowPastEvents
                    attribute="end"
                    items={[
                      {
                        label: 'Show past events',
                        end: Date.now(),
                      },
                    ]}
                  />
                </Panel> */}

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
              </div>
            </aside>

            <main className="w-3/4 px-2">
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
    </div>
  );
}

function Hit({ hit }) {
  return (
    <article className="border p-4 rounded shadow">
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
            style={{ width: 32, height: 32 }}
          />
        )}{' '}
        By {hit.speaker}
      </a>

      <p>
        <Snippet attribute="description" hit={hit} />
      </p>

      <p className="italic mt-4">
        Track: <Highlight attribute="track" hit={hit} />
      </p>

      <div className="text-gray-800 mt-0 py-1 px-2 border-solid border-2 border-gray-400">
        <strong>{hit.day}</strong> at <strong>{format(hit.start, 'p')}</strong>{' '}
        ({formatDistanceStrict(hit.start, hit.end)}) • Room{' '}
        <strong className="text-gray-800">{hit.room}</strong>
        {/* <FontAwesomeIcon icon="clock" /> */}
      </div>
    </article>
  );
}

Hit.propTypes = {
  hit: PropTypes.object.isRequired,
};

export default App;
