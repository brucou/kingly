import { ACTION_IDENTITY, createStateMachine, DEEP, historyState, INIT_EVENT, NO_OUTPUT } from "../src";

export const routes = {
    // Home route will be empty strings. Cf. apiRouter
    home: ""
};

export const loadingStates = ["TAGS_ARE_LOADING", "ARTICLES_ARE_LOADING"];

export const viewModel = {
    fetchStatus: ["LOADING", "NOK", "OK"],
    tabs: ["USER_FEED", "GLOBAL_FEED", "TAG_FILTER_FEED"]
};

export function not(f){
    return function(...args){
        return !f(...args)
    }
}

export const events = [
    "ROUTE_CHANGED",
    "TAGS_FETCHED_OK",
    "TAGS_FETCHED_NOK",
    "ARTICLES_FETCHED_OK",
    "ARTICLES_FETCHED_NOK",
    "AUTH_CHECKED",
    // "FILTERED_FEED_FETCHED_OK",
    // "FILTERED_FEED_FETCHED_NOK",
    "CLICKED_TAG",
    "CLICKED_PAGE",
    "CLICKED_USER_FEED",
    "CLICKED_GLOBAL_FEED",
    // "CLICKED_TAG_FILTER_FEED",
    // "CLICKED_NEW_ARTICLE",
    // "CLICKED_SETTINGS",
    // "CLICKED_USER_PROFILE",
    // "CLICKED_ARTICLE",
    // "CLICKED_AUTHOR",
];
const [
    ROUTE_CHANGED,
    TAGS_FETCHED_OK,
    TAGS_FETCHED_NOK,
    ARTICLES_FETCHED_OK,
    ARTICLES_FETCHED_NOK,
    AUTH_CHECKED,
    // FILTERED_FEED_FETCHED_OK,
    // FILTERED_FEED_FETCHED_NOK,
    CLICKED_TAG,
    CLICKED_PAGE,
    CLICKED_USER_FEED,
    CLICKED_GLOBAL_FEED,
    // CLICKED_TAG_FILTER_FEED,
    // CLICKED_NEW_ARTICLE,
    // CLICKED_SETTINGS,
    // CLICKED_USER_PROFILE,
    // CLICKED_ARTICLE,
    // CLICKED_AUTHOR,
] = events;

export const commands = [
    "RENDER",
    "FETCH_GLOBAL_FEED",
    "FETCH_ARTICLES_GLOBAL_FEED",
    "FETCH_ARTICLES_USER_FEED",
    "FETCH_AUTHENTICATION",
    "FETCH_USER_FEED",
    "FETCH_FILTERED_FEED",
];
const [
    RENDER,
    FETCH_GLOBAL_FEED,
    FETCH_ARTICLES_GLOBAL_FEED,
    FETCH_ARTICLES_USER_FEED,
    FETCH_AUTHENTICATION,
    FETCH_USER_FEED,
    FETCH_FILTERED_FEED,
] = commands;

const { home } = routes;
const [TAGS_ARE_LOADING, ARTICLES_ARE_LOADING] = loadingStates;
const {
    tabs: [USER_FEED, GLOBAL_FEED, TAG_FILTER_FEED]
} = viewModel;

const INIT = "start";
const initialControlState = INIT;
/**
 * @typedef {Object} ExtendedState
 * @property {Number} currentPage
 * @property {*} user
 * @property {Boolean} areTagsFetched
 * */
const initialExtendedState = {
    currentPage: 0,
    user: null,
    areTagsFetched: false
};
const states = {
    [INIT]: "",
    routing: "",
    home: {
        "fetching-authentication": "",
        "fetching-global-feed": {
            "pending-global-feed": "",
            "pending-global-feed-articles": ""
        },
        "fetching-user-feed": {
            "pending-user-feed": "",
            "pending-user-feed-articles": "",
        },
        "fetching-filtered-articles": {
            "pending-filtered-articles": "",
            "fetched-filtered-articles": "",
            "failed-fetch-filtered-articles": ""
        }
    }
};
const transitions = [
    { from: INIT, event: ROUTE_CHANGED, to: "routing", action: ACTION_IDENTITY },
    {
        from: "routing",
        event: void 0,
        guards: [{ predicate: isHomeRoute, to: "home", action: ACTION_IDENTITY }]
    },
    { from: "home", event: INIT_EVENT, to: "fetching-authentication", action: fetchAuthentication },
    {
        from: "fetching-authentication",
        event: AUTH_CHECKED,
        guards: [
            { predicate: isNotAuthenticated, to: "fetching-global-feed", action: updateAuthAndResetPage },
            { predicate: isAuthenticated, to: "fetching-user-feed", action: updateAuthAndResetPage }
        ]
    },
    {
        from: "fetching-global-feed",
        event: INIT_EVENT,
        guards: [
            {
                predicate: areTagsFetched,
                to: "pending-global-feed-articles",
                action: fetchGlobalFeedArticlesAndRenderLoading
            },
            { predicate: not(areTagsFetched), to: "pending-global-feed", action: fetchGlobalFeedAndRenderLoading },
        ]
    },
    { from: "pending-global-feed", event: TAGS_FETCHED_OK, to: "pending-global-feed", action: renderTags },
    { from: "pending-global-feed", event: TAGS_FETCHED_NOK, to: "pending-global-feed", action: renderTagsFetchError },
    {
        from: "fetching-global-feed",
        event: ARTICLES_FETCHED_OK,
        to: historyState(DEEP, "fetching-global-feed"),
        action: renderGlobalFeedArticles
    },
    {
        from: "fetching-global-feed",
        event: ARTICLES_FETCHED_NOK,
        to: historyState(DEEP, "fetching-global-feed"),
        action: renderGlobalFeedArticlesFetchError
    },
    { from: "fetching-global-feed", event: CLICKED_PAGE, to: "fetching-global-feed", action: updatePage },
    {
        from: "fetching-user-feed",
        event: INIT_EVENT,
        guards: [
            { predicate: areTagsFetched, to: "pending-user-feed-articles", action: fetchUserFeedArticlesAndRenderLoading },
            { predicate: not(areTagsFetched), to: "pending-user-feed", action: fetchUserFeedAndRenderLoading },
        ]
    },
    { from: "pending-user-feed", event: TAGS_FETCHED_OK, to: "pending-user-feed", action: renderTags },
    { from: "pending-user-feed", event: TAGS_FETCHED_NOK, to: "pending-user-feed", action: renderTagsFetchError },
    {
        from: "fetching-user-feed",
        event: ARTICLES_FETCHED_OK,
        to: historyState(DEEP, "fetching-user-feed"),
        action: renderUserFeedArticles
    },
    {
        from: "fetching-user-feed",
        event: ARTICLES_FETCHED_NOK,
        to: historyState(DEEP, "fetching-user-feed"),
        action: renderUserFeedArticlesFetchError
    },
    { from: "fetching-user-feed", event: CLICKED_PAGE, to: "fetching-authentication", action: updatePage },
    {
        from: "fetching-filtered-articles",
        event: INIT_EVENT,
        to: "pending-filtered-articles",
        action: fetchFilteredArticlesAndRenderLoading
    },
    {
        from: "pending-filtered-articles",
        event: ARTICLES_FETCHED_OK,
        to: "fetched-filtered-articles",
        action: renderFilteredArticles
    },
    {
        from: "pending-filtered-articles",
        event: ARTICLES_FETCHED_NOK,
        to: "failed-fetch-filtered-articles",
        action: renderFilteredArticlesFetchError
    },
    { from: "fetching-filtered-articles", event: CLICKED_PAGE, to: "fetching-filtered-articles", action: updatePage },
    { from: "home", event: CLICKED_TAG, to: "fetching-filtered-articles", action: resetPage },
    { from: "home", event: CLICKED_GLOBAL_FEED, to: "fetching-global-feed", action: resetPage },
    { from: "home", event: CLICKED_USER_FEED, to: "home", action: resetPage },
    { from: "home", event: ROUTE_CHANGED, to: "routing", action: ACTION_IDENTITY },
];

// State update
// Basically {a, b: {c, d}}, [{b:{e}]} -> {a, b:{e}}
// All Object.assign caveats apply
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
function updateState(extendedState, extendedStateUpdates) {
    const extendedStateCopy = Object.assign({}, extendedState);
    return extendedStateUpdates.reduce(
        (acc, x) => Object.assign(acc, x),
        extendedStateCopy
    );
}

// Guards
function isHomeRoute(extendedState, eventData, settings) {
    return eventData.hash === home;
}

function isAuthenticated(extendedState, eventData, settings) {
    const { user } = eventData;

    return Boolean(user);
}

function isNotAuthenticated(extendedState, eventData, settings) {
    const { user } = eventData;

    return !Boolean(user);
}

function areTagsFetched(extendedState, eventData, settings) {
    const { areTagsFetched } = extendedState;

    return areTagsFetched
}

// Action factories
function fetchGlobalFeedAndRenderLoading(extendedState, eventData, settings) {
    const { currentPage, user } = extendedState;

    return {
        updates: [],
        outputs: [
            { command: FETCH_GLOBAL_FEED, params: { page: currentPage } },
            {
                command: RENDER,
                params: {
                    tags: TAGS_ARE_LOADING,
                    articles: ARTICLES_ARE_LOADING,
                    activeFeed: GLOBAL_FEED,
                    user
                }
            }
        ]
    };
}

function fetchGlobalFeedArticlesAndRenderLoading(extendedState, eventData, settings) {
    const { currentPage, user } = extendedState;

    return {
        updates: [],
        outputs: [
            { command: FETCH_ARTICLES_GLOBAL_FEED, params: { page: currentPage } },
            {
                command: RENDER,
                params: {
                    articles: ARTICLES_ARE_LOADING,
                    activeFeed: GLOBAL_FEED,
                    user
                }
            }
        ]
    };
}

function renderTags(extendedState, eventData, settings) {
    return {
        updates: [],
        outputs: [
            {
                command: RENDER,
                params: { tags: eventData }
            }
        ]
    };
}

function renderTagsFetchError(extendedState, eventData, settings) {
    return {
        updates: [],
        outputs: [{ command: RENDER, params: { tags: eventData } }]
    };
}

function renderGlobalFeedArticles(extendedState, eventData, settings) {
    return {
        updates: [],
        outputs: [
            {
                command: RENDER,
                params: { articles: eventData }
            }
        ]
    };
}

function renderGlobalFeedArticlesFetchError(
    extendedState,
    eventData,
    settings
) {
    return {
        updates: [],
        outputs: [{ command: RENDER, params: { articles: eventData } }]
    };
}

function fetchAuthentication(extendedState, eventData, settings) {
    return {
        updates: [],
        outputs: [{ command: FETCH_AUTHENTICATION, params: void 0 }]
    };
}

function updateAuthAndResetPage(extendedState, eventData, settings) {
    const { user } = eventData;

    return {
        updates: [{ user }, { currentPage: 0 }],
        outputs: NO_OUTPUT
    };
}

function fetchUserFeedArticlesAndRenderLoading(extendedState, eventData, settings) {
    const { currentPage, user } = extendedState;
    const username = user && user.username;

    return {
        updates: [],
        outputs: [
            { command: FETCH_ARTICLES_USER_FEED, params: { page: currentPage, username } },
            {
                command: RENDER,
                params: {
                    articles: ARTICLES_ARE_LOADING,
                    activeFeed: USER_FEED,
                    user
                }
            }
        ]
    };
}

function fetchUserFeedAndRenderLoading(extendedState, eventData, settings) {
    const { currentPage, user } = extendedState;
    const username = user && user.username;

    return {
        updates: [],
        outputs: [
            { command: FETCH_USER_FEED, params: { page: currentPage, username } },
            {
                command: RENDER,
                params: { tags: TAGS_ARE_LOADING, articles: ARTICLES_ARE_LOADING, activeFeed: USER_FEED, user }
            }
        ]
    };
}

function updatePage(extendedState, eventData, settings) {
    const currentPage = eventData;

    return {
        updates: [
            { currentPage }
        ],
        outputs: []
    }
}

function renderUserFeedArticles(extendedState, eventData, settings) {
    return {
        updates: [],
        outputs: [
            {
                command: RENDER,
                params: { articles: eventData }
            }
        ]
    };
}

function renderUserFeedArticlesFetchError(extendedState, eventData, settings) {
    return {
        updates: [],
        outputs: [{
            command: RENDER,
            outputs: [{ command: RENDER, params: { articles: eventData } }]
        }]
    }
}

function fetchFilteredArticlesAndRenderLoading(extendedState, eventData, settings) {
    const { currentPage, user } = extendedState;
    const { tag } = eventData;

    return {
        updates: [],
        outputs: [
            { command: FETCH_FILTERED_FEED, params: { page: currentPage, tag } },
            { command: RENDER, params: { articles: ARTICLES_ARE_LOADING } }
        ]
    }
}

function renderFilteredArticles(extendedState, eventData, settings) {
    return {
        updates: [],
        outputs: [
            { command: RENDER, params: { articles: eventData } }
        ]
    }
}

function renderFilteredArticlesFetchError(extendedState, eventData, settings) {
    return {
        updates: [],
        outputs: [{
            command: RENDER,
            outputs: [{ command: RENDER, params: { articles: eventData } }]
        }]
    }
}

function resetPage(extendedState, eventData, settings) {
    const currentPage = eventData;

    return {
        updates: [
            { currentPage }
        ],
        outputs: []
    }
}

export const fsmDef = {
    initialControlState,
    initialExtendedState,
    states,
    events,
    transitions,
    updateState
};

export const fsmFactory = settings => createStateMachine(fsmDef, settings);
