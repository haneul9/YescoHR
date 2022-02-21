sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/mvc/controller/overviewEmployee/constants/ChartsSetting',
  ],
  (
    // prettier 방지용 주석
    BaseController,
    AppUtils,
    ChartsSetting
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.overviewEmployee.Main', {
      initializeModel() {
        return {
          busy: false,
          searchConditions: {
            Begda: moment().hours(9).toDate(),
            Orgeh: '',
            entryOrgeh: [],
          },
          contents: {
            A01: {
              tot: '308',
              totSub1: '300',
              totSub2: '8',
              data01: '297',
              data02: '290',
              data03: '7',
              data04: '21',
              data05: '20',
              data06: '1',
              data07: '10',
              data08: '10',
              data09: '0',
              data10: '1',
              data11: '1',
              data12: '0',
            },
            A02: {
              tot: '73명,24.2%',
              data01: '21.5%',
              data02: '65명',
              data03: '2.6%',
              data04: '8명',
            },
            A03: {
              data01: '292',
              data02: '8',
              data03: '4',
              data04: '3',
              data05: '1',
            },
            A04: {
              data01: '274',
              data02: '26',
              data03: '8',
            },
            A05: {
              tot: '17.1',
            },
            A06: {
              data01: '91.5%',
              data02: '287명',
              data03: '8.5%',
              data04: '24명',
            },
            A08: {
              data01: '117',
              data02: '64',
              data03: '53',
              data04: '38',
            },
            A09: {
              tot: '42.1',
            },
          },
        };
      },

      async onObjectMatched() {
        try {
          this.buildChart();
        } catch (oError) {
          this.debug('Controller > organization Main > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
        }
      },

      buildChart() {
        _.forEach(ChartsSetting.CHART, (chart) => {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: chart.id,
              type: chart.type,
              renderAt: `${chart.id}-container`,
              width: '100%',
              height: '100%',
              dataFormat: 'json',
              dataSource: chart.data,
            }).render();
          });
        });
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressSearch() {},

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
