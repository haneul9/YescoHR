sap.ui.define([], () => {
  'use strict';

  return {
    fillEach(array, callback) {
      'use strict';

      if (!array) {
        throw new TypeError('Target array is null or not defined.');
      }
      if (!Array.isArray(array)) {
        throw new TypeError('Target array is not array object.');
      }
      if (typeof callback !== 'function') {
        throw new TypeError('Callback is not a function.');
      }

      array.fill().forEach(callback, array);

      return array;
    },
  };
});
