sap.ui.define(
  [
    'sap/ui/yesco/common/Validator', //
  ],
  function (Validator) {
    'use strict';

    return {
      LIST_PAGE: [
        { type: 'ME', route: 'idp', detail: 'idp-detail', id: 'container-ehr---idp' },
        { type: 'ME', route: 'h/idp', detail: 'h/idp-detail', id: 'container-ehr---h_idp' },
        { type: 'MA', route: 'm/idp', detail: 'm/idp-detail', id: 'container-ehr---m_idp' },
        { type: 'MA', route: 'h/idpPry', detail: 'h/idpPry-detail', id: 'container-ehr---h_idpPry' },
      ],

      TAB: { COMP: 'T01', OPPO: 'T02' },
      APPRAISER_TYPE: { ME: 'ME', MA: 'MA', MB: 'MB' },
      DISPLAY_TYPE: { EDIT: 'X', DISPLAY_ONLY: 'D', HIDE: 'H', HIDDEN_VALUE: 'V' },
      PROCESS_TYPE: { LIST: { code: 'L', label: 'LABEL_00177' }, DETAIL: { code: 'D', label: 'LABEL_00165' }, SAVE: { code: 'T', label: 'LABEL_00103' }, SEND: { code: 'C', label: 'LABEL_00175' }, APPROVE: { code: 'P', label: 'LABEL_00123' }, REJECT: { code: 'R', label: 'LABEL_00124' }, CANCEL: { code: 'W', label: 'LABEL_10048' }, CONFIRM: { code: 'C', label: 'LABEL_10043' }, COMPLETE: { code: 'C', label: 'LABEL_00117' } },

      ITEM_PROPERTIES: ['Obj0', 'Z301', 'Fapp', 'Z305', 'Z307', 'Z309', 'Z311'],
      MANAGE_PROPERTIES: ['Z317', 'Z319'],
      REJECT_PROPERTIES: ['Rjctr', 'Rjctrin'],
      COMBO_PROPERTIES: ['Fapp'],

      VALIDATION_PROPERTIES: [
        { field: 'Fapp', label: 'LABEL_36012', type: Validator.SELECT1 }, // 목표수준
        { field: 'Z305', label: 'LABEL_36013', type: Validator.INPUT1 }, // 개발계획
        { field: 'Z307', label: 'LABEL_36014', type: Validator.INPUT1 }, // 교육과정 및\n자기개발활동
        // { field: 'Z309', label: 'LABEL_36015', type: Validator.INPUT1 }, // 필요지원사항
        { field: 'Z311', label: 'LABEL_36016', type: Validator.INPUT2 }, // 개발결과
        { field: 'Z317', label: 'LABEL_36017', type: Validator.INPUT1 }, // 팀장의견-개발계획/활동
        { field: 'Z319', label: 'LABEL_36018', type: Validator.INPUT2 }, // 팀장의견-개발결과
      ],

      FIELD_MAPPING: {
        Obj0: ['Obj0'],
        Z301: ['Z301'],
        Fapp: ['Fapp'],
        Z305: ['Z305'],
        Z307: ['Z307'],
        Z309: ['Z309'],
        Z311: ['Z311'],
        Z317: ['Z317'],
        Z319: ['Z319'],
      },

      FIELD_STATUS_MAP: {
        2: {
          S: { Z301: { ME: 'D' }, Z317: { ME: 'V' } },
          T: { Z317: { ME: 'V' } },
        },
        3: {},
        4: {
          S: { Z319: { ME: 'V' }, Z311: { MA: 'V' } },
          T: { Z319: { ME: 'V' } },
        },
        5: {},
      },

      BUTTON_STATUS_MAP: {
        2: {
          S: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X' }, SAVE: { process: true, label: 'LABEL_00103', ME: 'X', MA: '' } },
          T: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: 'X' } },
        },
        3: {
          S: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X' }, SAVE: { process: true, label: 'LABEL_00103', ME: 'X', MA: 'X' } },
        },
        4: {
          S: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X' }, SAVE: { process: true, label: 'LABEL_00103', ME: 'X', MA: '' } },
          T: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: 'X' } },
        },
        5: {
          X: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X' } },
        },
      },
    };
  }
);
