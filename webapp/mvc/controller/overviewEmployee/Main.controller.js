sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/mvc/controller/overviewEmployee/constants/ChartsSetting',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    BaseController,
    AppUtils,
    ChartsSetting,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.overviewEmployee.Main', {
      CHART_TYPE: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],

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
              busy: false,
              tot: '0',
              totSub1: '0',
              totSub2: '0',
              data01: '0',
              data02: '0',
              data03: '0',
              data04: '0',
              data05: '0',
              data06: '0',
              data07: '0',
              data08: '0',
              data09: '0',
              data10: '0',
              data11: '0',
              data12: '0',
            },
            A02: {
              busy: false,
              tot: '0명,0%',
              data01: '0%',
              data02: '0명',
              data03: '0%',
              data04: '0명',
            },
            A03: {
              busy: false,
              list: [],
            },
            A04: {
              busy: false,
              list: [],
            },
            A05: {
              busy: false,
              Cnt01: '0',
            },
            A06: {
              busy: false,
              data01: '0%',
              data02: '0명',
              data03: '0%',
              data04: '0명',
            },
            A07: {
              busy: false,
              list: [],
            },
            A08: {
              busy: false,
              list: [],
            },
            A09: {
              busy: false,
              Cnt01: '0',
            },
            A10: {
              busy: false,
            },
            A11: {
              busy: false,
            },
          },
        };
      },

      async onObjectMatched() {
        try {
          this.setAllBusy(true);

          const mFilters = { Zyear: '2022' };
          const fCurried = Client.getEntitySet(this.getModel(ServiceNames.PA));
          const aCharts = await Promise.all(_.map(this.CHART_TYPE, (type) => fCurried('HeadCountOverview', { ...mFilters, Headty: type })));

          _.forEach(aCharts, (data, idx) => {
            setTimeout(this.buildChart(idx, data), 0);
          });
        } catch (oError) {
          this.debug('Controller > m/overviewEmployee Main > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        }
      },

      setAllBusy(bBusy) {
        const oViewModel = this.getViewModel();

        _.times(11).forEach((idx) => oViewModel.setProperty(`/contents/A${_.padStart(++idx, 2, '0')}/busy`, bBusy));
      },

      buildChart(index, data) {
        const oViewModel = this.getViewModel();

        switch (index) {
          case 0:
            const [mTotal, ...aRow] = data;
            const mDataA = oViewModel.getProperty('/contents/A01');

            oViewModel.setProperty(
              '/contents/A01',
              _.chain(mDataA)
                .set('Cnt01', mTotal.Cnt01)
                .set('Cnt02', mTotal.Cnt02)
                .set('Cnt03', mTotal.Cnt03)
                .set('Cnt40', _.get(aRow, [0, 'Cnt01'], 0))
                .set('Cnt41', _.get(aRow, [0, 'Cnt02'], 0))
                .set('Cnt42', _.get(aRow, [0, 'Cnt03'], 0))
                .set('Cnt50', _.get(aRow, [1, 'Cnt01'], 0))
                .set('Cnt51', _.get(aRow, [1, 'Cnt02'], 0))
                .set('Cnt52', _.get(aRow, [1, 'Cnt03'], 0))
                .set('Cnt60', _.get(aRow, [2, 'Cnt01'], 0))
                .set('Cnt61', _.get(aRow, [2, 'Cnt02'], 0))
                .set('Cnt62', _.get(aRow, [2, 'Cnt03'], 0))
                .set('Cnt70', _.get(aRow, [3, 'Cnt01'], 0))
                .set('Cnt71', _.get(aRow, [3, 'Cnt02'], 0))
                .set('Cnt72', _.get(aRow, [3, 'Cnt03'], 0))
                .value()
            );

            oViewModel.setProperty('/contents/A01/busy', false);
            break;
          case 1:
            const mChartBSetting = ChartsSetting.CHART.A05;

            _.chain(mChartBSetting)
              // .set(['data', 'chart', 'yAxisMaxValue'], '200')
              .set(
                ['data', 'data'],
                _.map(data, (o) => ({ label: o.Ttltxt, value: o.Cnt01, color: '#8FABE8' }))
              )
              .commit();

            oViewModel.setProperty('/contents/A05/busy', false);

            FusionCharts.ready(() => {
              new FusionCharts({
                id: mChartBSetting.id,
                type: mChartBSetting.type,
                renderAt: `${mChartBSetting.id}-container`,
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: mChartBSetting.data,
              }).render();
            });

            break;
          case 2:
            const mChartCSetting = ChartsSetting.CHART.A09;

            _.chain(mChartCSetting)
              // .set(['data', 'chart', 'yAxisMaxValue'], '200')
              .set(
                ['data', 'data'],
                _.map(data, (o) => ({ label: o.Ttltxt, value: o.Cnt01, color: '#8FABE8' }))
              )
              .commit();

            oViewModel.setProperty('/contents/A09/busy', false);

            FusionCharts.ready(() => {
              new FusionCharts({
                id: mChartCSetting.id,
                type: mChartCSetting.type,
                renderAt: `${mChartCSetting.id}-container`,
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: mChartCSetting.data,
              }).render();
            });

            break;
          case 3:
            const mDataD = oViewModel.getProperty('/contents/A02');
            const mChartDSetting = ChartsSetting.CHART.A02;

            oViewModel.setProperty(
              '/contents/A02',
              _.chain(mDataD)
                .set('Title01', _.get(data, [0, 'Ttltxt']))
                .set('Cnt01', _.get(data, [0, 'Cnt01']))
                .set('Cnt02', _.get(data, [0, 'Rte01']))
                .set('Title10', _.get(data, [1, 'Ttltxt']))
                .set('Cnt11', _.get(data, [1, 'Rte01']))
                .set('Cnt12', _.get(data, [1, 'Cnt01']))
                .set('Title20', _.get(data, [2, 'Ttltxt']))
                .set('Cnt21', _.get(data, [2, 'Rte01']))
                .set('Cnt22', _.get(data, [2, 'Cnt01']))
                .value()
            );

            const sMvalue = _.chain(data).get([1, 'Rte01']).parseInt().value();
            const sZvalue = _.chain(data).get([2, 'Rte01']).parseInt().value();

            _.chain(mChartDSetting)
              .get('data')
              .set(['colorrange', 'color', 0, 'maxvalue'], _.toString(sMvalue))
              .set(['colorrange', 'color', 1, 'minvalue'], _.toString(sMvalue + 1))
              .set(['colorrange', 'color', 1, 'maxvalue'], _.toString(_.add(sMvalue, sZvalue)))
              .set(['colorrange', 'color', 2, 'minvalue'], _.toString(_.add(sMvalue, sZvalue) + 1))
              .commit();

            oViewModel.setProperty('/contents/A02/busy', false);

            FusionCharts.ready(() => {
              new FusionCharts({
                id: mChartDSetting.id,
                type: mChartDSetting.type,
                renderAt: `${mChartDSetting.id}-container`,
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: mChartDSetting.data,
              }).render();
            });

            break;
          case 4:
            const mDataE = oViewModel.getProperty('/contents/A06');
            const mChartESetting = ChartsSetting.CHART.A06;

            oViewModel.setProperty(
              '/contents/A06',
              _.chain(mDataE)
                .set('Cnt11', _.get(data, [0, 'Rte01']))
                .set('Cnt12', _.get(data, [0, 'Cnt01']))
                .set('Cnt21', _.get(data, [1, 'Rte01']))
                .set('Cnt22', _.get(data, [1, 'Cnt01']))
                .value()
            );

            const sEMvalue = _.chain(data).get([0, 'Cnt01']).parseInt().value();
            const sEWvalue = _.chain(data).get([1, 'Cnt01']).parseInt().value();

            _.chain(mChartESetting)
              .get('data')
              .set(['value'], _.toString(_.add(sEMvalue, sEWvalue)))
              .set(['chart', 'upperLimit'], _.toString(_.add(sEMvalue, sEWvalue)))
              .set(['colorrange', 'color', 0, 'maxvalue'], _.toString(sEMvalue))
              .set(['colorrange', 'color', 1, 'minvalue'], _.toString(sEMvalue + 1))
              .set(['colorrange', 'color', 1, 'maxvalue'], _.toString(_.add(sEMvalue, sEWvalue)))
              .commit();

            oViewModel.setProperty('/contents/A06/busy', false);

            FusionCharts.ready(() => {
              new FusionCharts({
                id: mChartESetting.id,
                type: mChartESetting.type,
                renderAt: `${mChartESetting.id}-container`,
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: mChartESetting.data,
              }).render();
            });

            break;
          case 5:
            const mChartFSetting = ChartsSetting.CHART.A10;

            _.chain(mChartFSetting)
              // .set(['data', 'chart', 'yAxisMaxValue'], '120')
              .set(
                ['data', 'data'],
                _.map(data, (o) => ({ label: o.Ttltxt, value: o.Cnt01, color: '#8FABE8' }))
              )
              .commit();

            oViewModel.setProperty('/contents/A10/busy', false);

            FusionCharts.ready(() => {
              new FusionCharts({
                id: mChartFSetting.id,
                type: mChartFSetting.type,
                renderAt: `${mChartFSetting.id}-container`,
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: mChartFSetting.data,
              }).render();
            });

            break;
          case 6:
            const mChartGSetting = ChartsSetting.CHART.A03;
            const aGcolors = ['#8FABE8', '#81DAEA', '#77D561', '#FFE479', '#FC564F'];

            oViewModel.setProperty(
              '/contents/A03/list',
              _.map(data, (o, i) => ({ ...o, Type: `type0${++i}` }))
            );

            _.chain(mChartGSetting)
              .set(['data', 'chart', 'paletteColors'], _.chain(aGcolors).take(data.length).join(',').value())
              .set(
                ['data', 'data'],
                _.map(data, (o) => ({ label: o.Ttltxt, value: o.Cnt01 }))
              )
              .commit();

            oViewModel.setProperty('/contents/A03/busy', false);

            FusionCharts.ready(() => {
              new FusionCharts({
                id: mChartGSetting.id,
                type: mChartGSetting.type,
                renderAt: `${mChartGSetting.id}-container`,
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: mChartGSetting.data,
              }).render();
            });

            break;
          case 7:
            const mChartHSetting = ChartsSetting.CHART.A07;
            const aHcolors = ['#8FABE8', '#81DAEA', '#77D561', '#FFE479', '#FC564F'];

            oViewModel.setProperty(
              '/contents/A07/list',
              _.map(data, (o, i) => ({ ...o, Type: `type0${++i}` }))
            );

            _.chain(mChartHSetting)
              .set(['data', 'chart', 'paletteColors'], _.chain(aHcolors).take(data.length).join(',').value())
              .set(
                ['data', 'data'],
                _.map(data, (o) => ({ label: o.Ttltxt, value: o.Cnt01 }))
              )
              .commit();

            oViewModel.setProperty('/contents/A07/busy', false);

            FusionCharts.ready(() => {
              new FusionCharts({
                id: mChartHSetting.id,
                type: mChartHSetting.type,
                renderAt: `${mChartHSetting.id}-container`,
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: mChartHSetting.data,
              }).render();
            });

            break;
          case 8:
            const mChartISetting = ChartsSetting.CHART.A04;
            const aIcolors = ['#8FABE8', '#81DAEA', '#77D561', '#FFE479', '#FC564F'];

            oViewModel.setProperty(
              '/contents/A04/list',
              _.map(data, (o, i) => ({ ...o, Type: `type0${++i}` }))
            );

            _.chain(mChartISetting)
              .set(['data', 'chart', 'paletteColors'], _.chain(aIcolors).take(data.length).join(',').value())
              .set(
                ['data', 'data'],
                _.map(data, (o) => ({ label: o.Ttltxt, value: o.Cnt01 }))
              )
              .commit();

            oViewModel.setProperty('/contents/A04/busy', false);

            FusionCharts.ready(() => {
              new FusionCharts({
                id: mChartISetting.id,
                type: mChartISetting.type,
                renderAt: `${mChartISetting.id}-container`,
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: mChartISetting.data,
              }).render();
            });

            break;
          case 9:
            const mChartJSetting = ChartsSetting.CHART.A08;
            const aJcolors = ['#8FABE8', '#81DAEA', '#77D561', '#FFE479', '#FC564F'];

            oViewModel.setProperty(
              '/contents/A08/list',
              _.map(data, (o, i) => ({ ...o, Type: `type0${++i}` }))
            );

            _.chain(mChartJSetting)
              .set(['data', 'chart', 'paletteColors'], _.chain(aJcolors).take(data.length).join(',').value())
              .set(
                ['data', 'data'],
                _.map(data, (o) => ({ label: o.Ttltxt, value: o.Cnt01 }))
              )
              .commit();

            oViewModel.setProperty('/contents/A08/busy', false);

            FusionCharts.ready(() => {
              new FusionCharts({
                id: mChartJSetting.id,
                type: mChartJSetting.type,
                renderAt: `${mChartJSetting.id}-container`,
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: mChartJSetting.data,
              }).render();
            });

            break;
          case 10:
            const mChartKSetting = ChartsSetting.CHART.A11;
            _.chain(mChartKSetting)
              // .set(['data', 'chart', 'yAxisMaxValue'], '60')
              .set(
                ['data', 'categories', 0, 'category'],
                _.map(data, (o) => ({ label: o.Ttltxt }))
              )
              .set(['data', 'dataset', 0], {
                seriesname: '팀원',
                color: '#8FABE8',
                data: _.map(data, (o) => ({ value: o.Cnt01 })),
              })
              .set(['data', 'dataset', 1], {
                seriesname: '팀장',
                color: '#FFE479',
                data: _.map(data, (o) => ({ value: o.Cnt02 })),
              })
              .commit();

            oViewModel.setProperty('/contents/A11/busy', false);

            FusionCharts.ready(() => {
              new FusionCharts({
                id: mChartKSetting.id,
                type: mChartKSetting.type,
                renderAt: `${mChartKSetting.id}-container`,
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: mChartKSetting.data,
              }).render();
            });

            break;
          default:
            break;
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressSearch() {},

      onPressACount() {},

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
