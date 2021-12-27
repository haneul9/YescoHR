sap.ui.define(
  [
    'sap/ui/yesco/common/Validator', //
  ],
  function (Validator) {
    'use strict';

    return {
      LIST_PAGE: { ME: { route: 'performance', id: 'container-ehr---performance' }, MA: { route: 'm/performancePry', id: 'container-ehr---m_performancePry' }, MB: { route: 'm/performanceSry', id: 'container-ehr---m_performanceSry' } },
      REJECT_DIALOG_ID: 'sap.ui.yesco.mvc.view.performance.fragment.RejectDialog',

      APPRAISER_TYPE: { ME: 'ME', MA: 'MA', MB: 'MB' },
      PROCESS_TYPE: { LIST: { code: 'L', label: 'LABEL_00177' }, DETAIL: { code: 'D', label: 'LABEL_00165' }, SAVE: { code: 'T', label: 'LABEL_00103' }, SEND: { code: 'C', label: 'LABEL_00175' } },
      DISPLAY_TYPE: { EDIT: 'X', DISPLAY_ONLY: 'D', HIDE: 'H', HIDDEN_VALUE: 'V' },
      GOAL_TYPE: { STRATEGY: { code: '1', name: 'strategy' }, DUTY: { code: '2', name: 'duty' } },

      REJECT_PROPERTIES: ['Rjctr', 'Rjctrin'],
      SUMMARY_PROPERTIES: ['Zmepoint', 'Zmapoint', 'Zmbgrade'],
      MANAGE_PROPERTIES: ['Z131', 'Z132', 'Z136', 'Z137', 'Z140', 'Papp1', 'Papp2', 'origin'],
      GOAL_PROPERTIES: ['Obj0', 'Fwgt', 'Z101', 'Z103', 'Z103s', 'Z109', 'Z111', 'Zapgme', 'Zapgma', 'Ztbegda', 'Ztendda', 'Zmarslt', 'Zrslt', 'Z1175', 'Z1174', 'Z1173', 'Z1172', 'Z1171', 'Z125Ee', 'Z125Er', 'origin'],
      COMBO_PROPERTIES: ['Zapgme', 'Zapgma', 'Z103s', 'Z111', 'Zmbgrade'],

      VALIDATION_PROPERTIES: [
        { field: 'Obj0', label: 'LABEL_10033', type: Validator.INPUT2 }, // 목표
        { field: 'Fwgt', label: 'LABEL_10021', type: Validator.INPUT2 }, // 가중치(%)
        { field: 'Zapgme', label: 'LABEL_10003', type: Validator.SELECT2 }, // 자기평가
        { field: 'Zapgma', label: 'LABEL_10022', type: Validator.SELECT2 }, // 1차평가
        { field: 'Z103s', label: 'LABEL_10023', type: Validator.SELECT2 }, // 연관 상위 목표
        { field: 'Ztbegda', label: 'LABEL_10024', type: Validator.INPUT1 }, // 목표수행 시작일
        { field: 'Ztendda', label: 'LABEL_10025', type: Validator.INPUT1 }, // 목표수행 종료일
        { field: 'Z109', label: 'LABEL_10026', type: Validator.INPUT2 }, // 진척도(%)
        { field: 'Z111', label: 'LABEL_00261', type: Validator.SELECT2 }, // 진행상태
        { field: 'Zmarslt', label: 'LABEL_10027', type: Validator.INPUT2 }, // 핵심결과
        { field: 'Zrslt', label: 'LABEL_10028', type: Validator.INPUT1 }, // 실적
        { field: 'Z1175', label: 'LABEL_10029', type: Validator.INPUT1 }, // 달성방안
        { field: 'Z1174', label: 'LABEL_10029', type: Validator.INPUT1 }, // 달성방안
        { field: 'Z1173', label: 'LABEL_10029', type: Validator.INPUT1 }, // 달성방안
        { field: 'Z1172', label: 'LABEL_10029', type: Validator.INPUT1 }, // 달성방안
        { field: 'Z1171', label: 'LABEL_10029', type: Validator.INPUT1 }, // 달성방안
        { field: 'Zmepoint', label: 'LABEL_10012', type: Validator.INPUT2 }, // 자기 평가점수
        { field: 'Zmapoint', label: 'LABEL_10013', type: Validator.INPUT2 }, // 1차 평가점수
        { field: 'Zmbgrade', label: 'LABEL_10014', type: Validator.SELECT1 }, // 최종 평가등급
      ],

      BUTTON_STATUS_MAP: {
        2: {
          A: { REJECT_REASON: { label: 'LABEL_00142', ME: '', MA: '', MB: '' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: '', MB: '' } },
          B: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: 'X', MA: 'X', MB: '' } },
          C: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: 'X', MB: '' } },
          D: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: 'X', MB: '' } },
        },
      },

      FIELD_MAPPING: {
        Z131: ['Z131'],
        Z132: ['Z132'],
        Zmepoint: ['Zmepoint'],
        Zmapoint: ['Zmapoint'],
        Zmbgrade: ['Zmbgrade'],
        Papp: ['Zapgme', 'Papp1'],
        Fapp: ['Zapgma', 'Papp2'],
        Z105: ['Ztbegda', 'Ztendda'],
        Z113: ['Zmarslt', 'Zrslt'],
        Z125: ['Z125Ee', 'Z125Er'],
        Z117: ['Z1175', 'Z1174', 'Z1173', 'Z1172', 'Z1171'],
      },

      FIELD_STATUS_MAP: {
        2: {
          A: { Zmepoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmapoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' }, Zrslt: { ME: 'H', MA: 'H', MB: 'H' } },
          B: { Zmepoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmapoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' }, Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z125Ee: { ME: 'X', MA: 'V', MB: 'V' }, Z125Er: { ME: 'D', MA: 'D', MB: 'D' }, Z131: { MA: 'V', MB: 'V' } },
          C: { Zmepoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmapoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' }, Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z125Ee: { ME: 'D', MA: 'D', MB: 'D' }, Z125Er: { ME: 'V', MA: 'X', MB: 'V' }, Z132: { ME: 'V', MB: 'V' } },
          D: { Zmepoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmapoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' }, Zrslt: { ME: 'H', MA: 'H', MB: 'H' } },
        },
      },
    };
  }
);
