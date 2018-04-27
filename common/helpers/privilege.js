function hasPrivilege(userPrivileges, Privilege){
    let priv = userPrivileges & Privilege;
    return priv > 0 ? true : false;
}
function makePrivileges(Privilege = []){
    let priv = 0;
    for (let i = 0; i < int.length; i++) {
        const element = int[i];
        priv = priv + element;
    }
    return priv;
}
module.exports = {
    hasPrivilege: hasPrivilege,
    makePrivileges: makePrivileges
};