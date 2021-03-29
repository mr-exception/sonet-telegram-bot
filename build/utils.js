"use strict";
var generateFullName = function (user) {
    var result = [];
    if (user.first_name)
        result.push(user.first_name);
    if (user.last_name)
        result.push(user.last_name);
    return result.join(" ");
};
module.exports = {
    generateFullName: generateFullName,
};
