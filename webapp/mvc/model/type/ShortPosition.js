sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/SimpleType',
  ],
  (
    // prettier 방지용 주석
    SimpleType
  ) => {
    'use strict';

    return SimpleType.extend('sap.ui.yesco.mvc.model.type.ShortPosition', {
      formatValue(oValue) {
        return /Senior(\s|\\n)/s.test(oValue) ? (oValue || '').replace(/Senior(\s|\\n)/, 'Sr.') : oValue || '';
      },

      parseValue(oValue) {
        return oValue;
      },

      _isMobile() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      },
    });
  }
);
