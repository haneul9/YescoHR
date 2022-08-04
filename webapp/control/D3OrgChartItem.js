sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Element',
  ],
  function (
    // prettier 방지용 주석
    Element
  ) {
    'use strict';

    return Element.extend('sap.ui.yesco.control.D3OrgChartItem', {
      metadata: {
        properties: {
          nodeId: 'string',
          parentNodeId: 'string',
          Stdat: { type: 'Object', defaultValue: null },
          Stext: 'string',
          Pernr: 'string',
          Ename: 'string',
          IpdatLabel: 'string',
          Ipdat: 'string',
          Photo: 'string',
          Botxt: 'string',
          JikgbtlLabel: 'string',
          Jikgbtl: 'string',
          ZorgLevl: 'string',
          TenureLabel: 'string',
          Tenure: 'string',
          // 승계
          ScsplnLabel: 'string', // 승계 계획(차년도)
          Scspln: 'string',
          ScspntLabel: 'string', // 승계 예정시점
          Scspnt: 'string',
          Cand1stLabel: 'string', // 승계 후보자(1순위)
          Cand1st1: 'string', // 승계후보자(1순위)_성명/직급
          Cand1st2: 'string', // 승계후보자(1순위)_인사영역
          Cand1st3: 'string', // 승계후보자(1순위)_포지션
          CandpntLabel: 'string', // 승계 가능시점
          Candpnt: 'string',
          CpPernr: 'string',
          CpPhoto: 'string',
        },
      },
    });
  }
);
