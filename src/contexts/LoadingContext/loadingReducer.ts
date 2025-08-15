export const loadingReducer = (state: boolean, action: LoadingActions): boolean => {
  switch (action.type) {
    case 'SET_LOADING':
      return action.payload
    default:
      return state;
  }
};
