export const authReducer = (state: User, action: UserActions): User => {
  switch (action.type) {
    case 'SET_USER':
      return action.payload;
    case 'LOGOUT':
      return {
        id: '0',
        username: '0',
        displayname: '0',
        avatar: '0',
      };
    default:
      return state;
  }
};
