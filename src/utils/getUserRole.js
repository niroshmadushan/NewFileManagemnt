const getUserRole = (role) => {
    const roles = {
      1: 'Admin',
      2: 'User',
    };
  
    return roles[role] || 'Unknown Role';
  };
  
  export default getUserRole;
  