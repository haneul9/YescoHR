sap.ui.define(
  [
    'sap/ui/yesco/common/Validator', //
  ],
  function (Validator) {
    'use strict';

    return {
      LIST_PAGE: [
        { type: 'ME', route: 'performance', detail: 'performance-detail', id: 'container-ehr---performance' },
        { type: 'ME', route: 'h/performance', detail: 'h/performance-detail', id: 'container-ehr---h_performance' },
        { type: 'MA', route: 'm/performancePry', detail: 'm/performancePry-detail', id: 'container-ehr---m_performancePry' },
        { type: 'MA', route: 'h/performancePry', detail: 'h/performancePry-detail', id: 'container-ehr---h_performancePry' },
        { type: 'MB', route: 'm/performanceSry', detail: 'm/performanceSry-detail', id: 'container-ehr---m_performanceSry' },
        { type: 'MB', route: 'h/performanceSry', detail: 'h/performanceSry-detail', id: 'container-ehr---h_performanceSry' },
      ],

      TAB: { GOAL: 'T01', OPINION: 'T02' },
      APPRAISER_TYPE: { ME: 'ME', MA: 'MA', MB: 'MB' },
      DISPLAY_TYPE: { EDIT: 'X', DISPLAY_ONLY: 'D', HIDE: 'H', HIDDEN_VALUE: 'V' },
      GOAL_TYPE: { STRATEGY: { code: '1', name: 'strategy' }, DUTY: { code: '2', name: 'duty' } },
      PROCESS_TYPE: { LIST: { code: 'L', label: 'LABEL_00177' }, DETAIL: { code: 'D', label: 'LABEL_00165' }, SAVE: { code: 'T', label: 'LABEL_00103' }, SEND: { code: 'C', label: 'LABEL_00175' }, APPROVE: { code: 'P', label: 'LABEL_00123' }, REJECT: { code: 'R', label: 'LABEL_00124' }, CANCEL: { code: 'W', label: 'LABEL_00118' }, CONFIRM: { code: 'C', label: 'LABEL_10043' }, COMPLETE: { code: 'C', label: 'LABEL_00117' }, SEARCH: { code: '1', label: 'LABEL_00100'}, DIALOG_SAVE: { code : '2', label: 'LABEL_00103' } },

      REJECT_PROPERTIES: ['Rjctr', 'Rjctrin'],
      OPPOSITION_PROPERTIES: ['Zzappid', 'Zdocid', 'Zzappee', 'Begda', 'Endda', 'Werks'],
      SUMMARY_PROPERTIES: ['Zmepoint', 'Zmapoint', 'Zmbgrade'],
      MANAGE_PROPERTIES: ['Z131', 'Z132', 'Z136', 'Z137', 'Z140', 'Papp1', 'Papp2', 'origin'],
      GOAL_PROPERTIES: ['Obj0', 'Fwgt', 'Z101', 'Z103', 'Z103s', 'Z109', 'Z111', 'Zapgme', 'Zapgma', 'Ztbegda', 'Ztendda', 'Zmarslt', 'Zrslt', 'Z1175', 'Z1174', 'Z1173', 'Z1172', 'Z1171', 'Z125Ee', 'Z125Er', 'origin'],
      COMBO_PROPERTIES: ['Zapgme', 'Zapgma', 'Z103s', 'Z111', 'Zmbgrade'],

      VALIDATION_PROPERTIES: [
        { field: 'Obj0', label: 'LABEL_10033', type: Validator.INPUT2 }, // ??????
        { field: 'Fwgt', label: 'LABEL_10021', type: Validator.INPUT2 }, // ?????????(%)
        { field: 'Zapgme', label: 'LABEL_10003', type: Validator.SELECT2 }, // ????????????
        { field: 'Zapgma', label: 'LABEL_10022', type: Validator.SELECT2 }, // 1?????????
        { field: 'Z103s', label: 'LABEL_10023', type: Validator.SELECT2 }, // ?????? ?????? ??????
        { field: 'Ztbegda', label: 'LABEL_10024', type: Validator.INPUT1 }, // ???????????? ?????????
        { field: 'Ztendda', label: 'LABEL_10025', type: Validator.INPUT1 }, // ???????????? ?????????
        { field: 'Z111', label: 'LABEL_00261', type: Validator.SELECT2 }, // ????????????
        { field: 'Zmarslt', label: 'LABEL_10027', type: Validator.INPUT2 }, // ????????????
        { field: 'Zrslt', label: 'LABEL_10028', type: Validator.INPUT1 }, // ??????
        { field: 'Z1175', label: 'LABEL_10029', type: Validator.INPUT1 }, // ????????????
        { field: 'Z1174', label: 'LABEL_10029', type: Validator.INPUT1 }, // ????????????
        { field: 'Z1173', label: 'LABEL_10029', type: Validator.INPUT1 }, // ????????????
        { field: 'Z1172', label: 'LABEL_10029', type: Validator.INPUT1 }, // ????????????
        { field: 'Z1171', label: 'LABEL_10029', type: Validator.INPUT1 }, // ????????????
        { field: 'Zmepoint', label: 'LABEL_10012', type: Validator.INPUT2 }, // ?????? ????????????
        { field: 'Zmapoint', label: 'LABEL_10013', type: Validator.INPUT2 }, // 1??? ????????????
        { field: 'Zmbgrade', label: 'LABEL_10014', type: Validator.SELECT1 }, // ?????? ????????????
        { field: 'Z131', label: 'LABEL_10036', type: Validator.INPUT1 }, // ?????? ?????? ??????
        { field: 'Z132', label: 'LABEL_10036', type: Validator.INPUT1 }, // ?????? ?????? ??????
        { field: 'Z136', label: 'LABEL_10037', type: Validator.INPUT1 }, // ?????? ?????? ??????
        { field: 'Z137', label: 'LABEL_10037', type: Validator.INPUT1 }, // ?????? ?????? ??????
        { field: 'Papp1', label: 'LABEL_10038', type: Validator.INPUT2 }, // ?????? ?????? ??????
        { field: 'Papp2', label: 'LABEL_10038', type: Validator.INPUT2 }, // ?????? ?????? ??????
        // { field: 'Z109', label: 'LABEL_10026', type: Validator.INPUT2 }, // ?????????(%)
      ],

      // ABAP <-> WEB Mapping fields
      FIELD_MAPPING: {
        Z103: ['Z103s'], // ?????? ?????? ??????
        Z109: ['Z109'], // ?????????
        Z111: ['Z111'], // ????????????
        Z131: ['Z131'], // ??????????????????-?????????
        Z132: ['Z132'], // ??????????????????-?????????
        Z136: ['Z136'], // ??????????????????-?????????
        Z137: ['Z137'], // ??????????????????-?????????
        Z140: ['Z140'], // ????????????
        Fapp: ['Zmbgrade'], // ??????????????????
        Z105: ['Ztbegda', 'Ztendda'], // ?????????????????????-Ztbegda, ?????????????????????-Ztbegda
        Z113: ['Zmarslt', 'Zrslt'], // Zmarslt-????????????, Zrslt-??????
        Z125: ['Z125Ee', 'Z125Er'], // ?????????????????????(???????????????)-Z125Ee, ?????????????????????(?????????)-Z125Er
        Z117: ['Z1175', 'Z1174', 'Z1173', 'Z1172', 'Z1171'], // ???????????? 1,2,3,4,5
        Papp: ['Zapgme', 'Zapgma', 'Papp1', 'Papp2', 'Zmepoint', 'Zmapoint'], // ????????????-Zapgme, 1?????????-Zapgma, ??????????????????(?????????)-Papp1, ??????????????????(?????????)-Papp2, ??????????????????-Zmepoint, 1???????????????-Zmapoint
      },

      // Web custom control by FIELD_MAPPING base
      FIELD_STATUS_MAP: {
        2: {
          A: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' } },
          B: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z125Ee: { ME: 'X', MA: 'V', MB: 'V' }, Z125Er: { ME: 'D', MA: 'D', MB: 'D' }, Z131: { MA: 'V', MB: 'V' } },
          C: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z125Ee: { ME: 'D', MA: 'D', MB: 'D' }, Z125Er: { ME: 'V', MA: 'X', MB: 'V' }, Z132: { ME: 'V', MB: 'V' } },
          D: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z140: { MA: 'X' } },
        },
        3: {
          F: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z125Ee: { ME: 'X', MA: 'V', MB: 'V' }, Z125Er: { ME: 'D', MA: 'D', MB: 'D' }, Z136: { MA: 'V', MB: 'V' }, Z140: { MA: 'X' } },
          G: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z125Ee: { ME: 'D', MA: 'D', MB: 'D' }, Z125Er: { ME: 'V', MA: 'X', MB: 'V' }, Z137: { ME: 'V', MB: 'V' } },
          H: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z140: { MA: 'X' } },
        },
        4: {
          1: { Zapgme: { ME: 'X', MA: 'V', MB: 'V' }, Zapgma: { ME: 'H', MA: 'D', MB: 'V' }, Papp1: { ME: 'X', MA: 'V', MB: 'V' }, Papp2: { ME: 'V', MA: 'D', MB: 'V' }, Zmepoint: { ME: 'D', MA: 'V', MB: 'V' }, Zmapoint: { ME: 'H', MA: 'D', MB: 'V' }, Zmarslt: { ME: 'D', MA: 'D' }, Zrslt: { MA: 'V', MB: 'V' }, Z140: { MA: 'X' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' } },
          A: { Ztbegda: { ME: 'D' }, Ztendda: { ME: 'D' }, Z109: { ME: 'D' }, Z111: { ME: 'D' }, Zmarslt: { ME: 'D' }, Zrslt: { ME: 'D' }, Zapgme: { ME: 'D', MA: 'D', MB: 'D' }, Papp1: { ME: 'D', MA: 'D', MB: 'D' }, Zmepoint: { ME: 'D', MA: 'D', MB: 'D' }, Zapgma: { ME: 'H', MA: 'X', MB: 'V' }, Papp2: { ME: 'V', MA: 'X', MB: 'V' }, Zmapoint: { ME: 'H', MA: 'D', MB: 'V' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' } },
          B: { Ztbegda: { ME: 'D' }, Ztendda: { ME: 'D' }, Z109: { ME: 'D' }, Z111: { ME: 'D' }, Zmarslt: { ME: 'D' }, Zrslt: { ME: 'D' }, Zapgme: { ME: 'D', MA: 'D', MB: 'D' }, Papp1: { ME: 'D', MA: 'D', MB: 'D' }, Zmepoint: { ME: 'D', MA: 'D', MB: 'D' }, Zapgma: { ME: 'H', MA: 'D', MB: 'D' }, Papp2: { ME: 'D', MA: 'D', MB: 'D' }, Zmapoint: { ME: 'H', MA: 'D', MB: 'D' }, Z140: { MA: 'D' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' } },
          2: { Zapgme: { ME: 'D', MA: 'D', MB: 'D' }, Papp1: { ME: 'D', MA: 'D', MB: 'D' }, Zmepoint: { ME: 'D', MA: 'D', MB: 'D' }, Zapgma: { ME: 'H', MA: 'D', MB: 'D' }, Papp2: { ME: 'D', MA: 'D', MB: 'D' }, Zmapoint: { ME: 'H', MA: 'D', MB: 'D' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'X' } },
          K: { Zapgme: { ME: 'D', MA: 'D', MB: 'D' }, Papp1: { ME: 'D', MA: 'D', MB: 'D' }, Zmepoint: { ME: 'D', MA: 'D', MB: 'D' }, Zapgma: { ME: 'H', MA: 'D', MB: 'D' }, Papp2: { ME: 'D', MA: 'D', MB: 'D' }, Zmapoint: { ME: 'H', MA: 'D', MB: 'D' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'D' } },
          N: { Zapgma: { ME: 'H' }, Zmapoint: { ME: 'H' }, Zmbgrade: { MB: 'D' } },
        },
        5: {
          Q: { Zapgma: { ME: 'H' }, Zmapoint: { ME: 'H' }, Zmbgrade: { MA: 'H' } },
          R: { Zapgma: { ME: 'H' }, Zmapoint: { ME: 'H' }, Zmbgrade: { MA: 'H' } },
          X: { Zapgma: { ME: 'H' }, Zmapoint: { ME: 'H' }, Zmbgrade: { MA: 'H' } },
        },
      },

      BUTTON_STATUS_MAP: {
        2: {
          A: { REJECT_REASON: { label: 'LABEL_00142', ME: '', MA: '', MB: '' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: '', MB: '' } },
          B: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: 'X', MA: '', MB: '' } },
          C: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: 'X', MB: '' } },
          D: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { label: 'LABEL_00103', ME: '', MA: 'X', MB: '' } },
        },
        3: {
          F: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: 'X', MA: 'X', MB: '' } },
          G: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: 'X', MB: '' } },
          H: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { label: 'LABEL_00103', ME: '', MA: 'X', MB: '' } },
        },
        4: {
          1: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, DIAGNOSIS: { label: 'LABEL_10034', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: 'X', MA: 'X', MB: '' } },
          A: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, DIAGNOSIS: { label: 'LABEL_10034', ME: 'X', MA: 'X', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: 'X', MB: '' } },
          B: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, DIAGNOSIS: { label: 'LABEL_10034', ME: 'X', MA: 'X', MB: 'X' } },
          2: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, DIAGNOSIS: { label: 'LABEL_10034', ME: 'X', MA: 'X', MB: 'X' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: '', MB: 'X' }, COMPLETE: { standard: true, MB: '' } },
          K: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, DIAGNOSIS: { label: 'LABEL_10034', ME: 'X', MA: 'X', MB: 'X' }, COMPLETE: { standard: true, MB: '' } },
          N: {},
        },
        5: {
          Q: {},
          R: { OPPO_VIEW: { label: 'LABEL_10044', ME: 'X' } },
          X: { OPPO_VIEW: { label: 'LABEL_10044', ME: 'X' } },
        },
      },
    };
  }
);
