import { createStore, combineReducers } from 'redux';
import spreadsheetReducer from './spreadsheetReducer';

const rootReducer = combineReducers({
  spreadsheet: spreadsheetReducer,
});

const store = createStore(rootReducer);

export default store;
