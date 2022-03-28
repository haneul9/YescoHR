sap.ui.define([], function () {
  'use strict';

  return {
    LIST_PAGE: [
      { type: 'ME', route: 'idp', detail: 'idp-detail', id: 'container-ehr---idp' },
      { type: 'ME', route: 'h/idp', detail: 'h/idp-detail', id: 'container-ehr---h_idp' },
      { type: 'MA', route: 'm/idp', detail: 'm/idp-detail', id: 'container-ehr---m_idp' },
    ],

    TAB: { COMP: 'T01', OPPO: 'T02' },
    APPRAISER_TYPE: { ME: 'ME', MA: 'MA', MB: 'MB' },
    DISPLAY_TYPE: { EDIT: 'X', DISPLAY_ONLY: 'D', HIDE: 'H', HIDDEN_VALUE: 'V' },
    PROCESS_TYPE: { LIST: { code: 'L', label: 'LABEL_00177' }, DETAIL: { code: 'D', label: 'LABEL_00165' }, SAVE: { code: 'T', label: 'LABEL_00103' }, SEND: { code: 'C', label: 'LABEL_00175' }, APPROVE: { code: 'P', label: 'LABEL_00123' }, REJECT: { code: 'R', label: 'LABEL_00124' }, CANCEL: { code: 'W', label: 'LABEL_00118' }, CONFIRM: { code: 'C', label: 'LABEL_10043' } },
  };
});
