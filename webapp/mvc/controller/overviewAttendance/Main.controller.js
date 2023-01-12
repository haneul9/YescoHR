sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/overviewAttendance/constants/ChartsSetting',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    BaseController,
    ChartsSetting
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.overviewAttendance.Main', {
      initializeModel() {
        return {
          busy: false,
          searchConditions: {
            Datum: moment().hours(9).toDate(),
            Werks: '',
            Orgeh: '',
          },
          entry: {
            Werks: [],
            Orgeh: [],
          },
          contents: {
            A01: { busy: false, hasLink: false, Headty: '', data: {} },
            A02: { busy: false, hasLink: false, Headty: '', data: {} },
            A03: { busy: false, hasLink: false, Headty: '', data: {} },
            A04: { busy: false, hasLink: false, Headty: '', data: {} },
            A05: { busy: false, hasLink: false, Headty: '' },
            A06: { busy: false, hasLink: false, Headty: '' },
            A07: { busy: false, hasLink: false, Headty: '' },
            A08: { busy: false, hasLink: false, Headty: '', data: {} },
            A09: { busy: false, hasLink: false, Headty: '', data: {} },
            A10: { busy: false, hasLink: false, Headty: '' },
          },
          dialog: {
            busy: false,
            rowCount: 0,
            param: {},
            list: [],
            sub: { list: [] },
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          this.setAllBusy(true);

          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const mAppointeeData = this.getAppointeeData();
          const [aPersaEntry, aOrgehEntry] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'WerksList', { Pernr: mAppointeeData.Pernr }), //
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: mAppointeeData.Werks, Pernr: mAppointeeData.Pernr }),
          ]);

          oViewModel.setProperty('/entry/Werks', aPersaEntry);
          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Werks', mAppointeeData.Werks);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointeeData.Orgeh) ? mAppointeeData.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const mFilters = oViewModel.getProperty('/searchConditions');

          _.forEach(ChartsSetting.CHART_TYPE, (o) => {
            if (o.Device.includes('PC')) {
              this.buildChart(oModel, mFilters, o);
            }
          });

          window.callAttendanceDetail = (sArgs) => {
            $('#fusioncharts-tooltip-element').css('z-index', 7);

            const aProps = ['Headty', 'Discod'];
            const aArgs = _.split(sArgs, ',');
            const mPayload = _.zipObject(_.take(aProps, aArgs.length), aArgs);

            this.callDetailPopup(mPayload);
          };
        } catch (oError) {
          this.debug('Controller > m/overviewAttendance Main > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        }
      },

      setAllBusy(bBusy) {
        const oViewModel = this.getViewModel();

        _.forEach(ChartsSetting.CHART_TYPE, (o) => {
          if (o.Device.includes('PC')) {
            oViewModel.setProperty(`/contents/${o.Target}/busy`, bBusy);
          }
        });
      },

      async buildChart(oModel, mFilters, mChartInfo) {
        const oViewModel = this.getViewModel();
        const aChartDatas = await Client.getEntitySet(oModel, 'TimeOverview', { ...mFilters, Headty: mChartInfo.Headty });
        const vDataObject = oViewModel.getProperty(`/contents/${mChartInfo.Target}/data`);
        const mChartSetting = _.chain(ChartsSetting.CHART_OPTIONS).get(mChartInfo.Chart).cloneDeep().value();

        oViewModel.setProperty(`/contents/${mChartInfo.Target}/Headty`, mChartInfo.Headty);
        oViewModel.setProperty(`/contents/${mChartInfo.Target}/busy`, false);

        if (_.has(mChartInfo, 'Fields')) {
          oViewModel.setProperty(
            `/contents/${mChartInfo.Target}/data`,
            _.chain(vDataObject)
              .tap((obj) => _.forEach(mChartInfo.Fields, (o) => _.set(obj, o.prop, _.get(aChartDatas, o.path))))
              .value()
          );
        }

        switch (mChartInfo.Chart) {
          case 'cylinder':
            setTimeout(() => {
              const iChartHeight = $('.portlet-p06-chart-area').height() - $('.portlet-p06-chart-caption').height() - $('.portlet-p06-chart-value').height();

              _.chain(mChartSetting)
                .set(['chart', 'cylHeight'], iChartHeight - 20)
                .set(['chart', 'plotToolText'], AppUtils.getBundleText('LABEL_01122', '$dataValue')) // 출근율: <b>$dataValue%</b>
                .set('value', _.chain(aChartDatas).get([0, 'Rte01']).toNumber().value())
                .commit();

              mChartInfo.ChartHeight = iChartHeight;

              this.callFusionChart(mChartInfo, mChartSetting);
            }, 300);

            break;
          case 'column2d':
            let fColumn2dMaxValues = 0;
            _.chain(mChartSetting)
              .set(
                ['data'],
                _.map(aChartDatas, (o) => {
                  fColumn2dMaxValues = Math.max(fColumn2dMaxValues, Number(o.Cnt01));
                  return { label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod01}` };
                })
              )
              .commit();

            mChartSetting.chart.yAxisMaxValue = Math.ceil(fColumn2dMaxValues * 1.3);

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'bar2d':
            let fBar2dMaxValues = 0;
            _.chain(mChartSetting)
              .set(
                ['data'],
                _.map(aChartDatas, (o) => {
                  fBar2dMaxValues = Math.max(fBar2dMaxValues, Number(o.Cnt01));
                  return { label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod01}` };
                })
              )
              .commit();

            mChartSetting.chart.yAxisMaxValue = Math.ceil(fBar2dMaxValues * 1.3);

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'mscombi2d':
            _.chain(mChartSetting)
              .set(
                ['categories', 0, 'category', 0],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt }))
              )
              .set(['dataset', 0], {
                seriesName: this.getBundleText('LABEL_28048'), // 당일
                showValues: '1',
                color: '#7BB4EB',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt01, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod01}` })),
              })
              .set(['dataset', 1], {
                seriesName: this.getBundleText('LABEL_00196'), // 누적
                renderAs: 'line',
                color: '#FFAC4B',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt02, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod02}` })),
              })
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'mscolumn2d':
            let fMscolumn2dMaxValues = 0;
            _.chain(mChartSetting)
              .set(
                ['categories', 0, 'category', 0],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt.replace(/\(/, ' (') }))
              )
              .set(['dataset', 0], {
                seriesname: this.getBundleText('LABEL_32004'), // 법정
                color: '#7BB4EB',
                data: _.map(aChartDatas, (o) => {
                  fMscolumn2dMaxValues = Math.max(fMscolumn2dMaxValues, Number(o.Cnt01));
                  return { value: o.Cnt01, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod01}` };
                }),
              })
              .set(['dataset', 1], {
                seriesname: 'OT',
                color: '#FFAC4B',
                data: _.map(aChartDatas, (o) => {
                  fMscolumn2dMaxValues = Math.max(fMscolumn2dMaxValues, Number(o.Cnt02));
                  return { value: o.Cnt02, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod02}` };
                }),
              })
              .set(['dataset', 2], {
                seriesname: this.getBundleText('LABEL_32005'), // 초과인원
                color: '#ff5a5a',
                data: _.map(aChartDatas, (o) => {
                  fMscolumn2dMaxValues = Math.max(fMscolumn2dMaxValues, Number(o.Cnt03));
                  return { value: o.Cnt03, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod03}` };
                }),
              })
              .commit();

            mChartSetting.chart.yAxisMaxValue = Math.ceil(fMscolumn2dMaxValues * 1.5);

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          default:
            break;
        }
      },

      callFusionChart(mChartInfo, mChartSetting) {
        if (_.isEmpty(mChartSetting)) return;

        const sChartId = `attendance-${_.toLower(mChartInfo.Target)}-chart`;

        if (!FusionCharts(sChartId)) {
          FusionCharts.ready(() => {
            FusionCharts.getInstance({
              id: sChartId,
              type: _.replace(mChartInfo.Chart, '-S', ''),
              renderAt: `${sChartId}-container`,
              width: _.has(mChartInfo, 'ChartWidth') ? mChartInfo.ChartWidth : '100%',
              height: _.has(mChartInfo, 'ChartHeight') ? mChartInfo.ChartHeight : '100%',
              dataFormat: 'json',
              dataSource: mChartSetting,
            }).render();
          });
        } else {
          const oChart = FusionCharts(sChartId);

          setTimeout(() => {
            oChart.setChartData(mChartSetting, 'json');
            oChart.render();
          }, 200);
        }
      },

      formatDetailRowHighlight(sValue) {
        switch (_.toNumber(sValue)) {
          case 1:
            return sap.ui.core.IndicationColor.Indication03;
          case 2:
            return sap.ui.core.IndicationColor.Indication02;
          case 3:
            return sap.ui.core.IndicationColor.Indication04;
          default:
            return null;
        }
      },

      async openDialog(sHeadty) {
        const oView = this.getView();
        let oDialog = null;

        switch (sHeadty) {
          case 'A': // 현재 근무현황
            if (!this.oDetail1Dialog) {
              this.oDetail1Dialog = await Fragment.load({
                id: oView.getId(),
                name: 'sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail1',
                controller: this,
              });

              oView.addDependent(this.oDetail1Dialog);
            }

            oDialog = this.oDetail1Dialog;
            this.oDetail1Dialog.open();
            break;
          case 'B': // 평균근무시간
          case 'C': // OT근무현황
          case 'H': // 조직별 OT평균시간
          case 'I': // 직급별 OT평균시간
          case 'J': // 주 단위 근무시간 추이
            if (!this.oDetail3Dialog) {
              this.oDetail3Dialog = await Fragment.load({
                id: oView.getId(),
                name: 'sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail3',
                controller: this,
              });

              oView.addDependent(this.oDetail3Dialog);
            }

            oDialog = this.oDetail3Dialog;
            this.oDetail3Dialog.open();
            break;
          case 'D': // 휴가 사용율
          case 'E': // 조직별 연차사용율
          case 'F': // 직급별 연차사용율
          case 'G': // 월단위 연차사용율 추이
            if (!this.oDetail2Dialog) {
              this.oDetail2Dialog = await Fragment.load({
                id: oView.getId(),
                name: 'sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail2',
                controller: this,
              });

              oView.addDependent(this.oDetail2Dialog);
            }

            oDialog = this.oDetail2Dialog;
            this.oDetail2Dialog.open();
            break;
          case 'X1': // sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail3
            if (!this.oDetail4Dialog) {
              this.oDetail4Dialog = await Fragment.load({
                id: oView.getId(),
                name: 'sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail4',
                controller: this,
              });

              oView.addDependent(this.oDetail4Dialog);
            }

            oDialog = this.oDetail4Dialog;
            this.oDetail4Dialog.open();
            break;
          case 'X2': // sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail2
            if (!this.oDetail5Dialog) {
              this.oDetail5Dialog = await Fragment.load({
                id: oView.getId(),
                name: 'sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail5',
                controller: this,
              });

              oView.addDependent(this.oDetail5Dialog);
            }

            oDialog = this.oDetail5Dialog;
            this.oDetail5Dialog.open();
            break;
          default:
            break;
        }

        $('#fusioncharts-tooltip-element').hide();

        return oDialog;
      },

      async callDetailPopup(mPayload) {
        const oViewModel = this.getViewModel();
        let oDialog = null;

        oViewModel.setProperty('/dialog/busy', true);
        oViewModel.setProperty('/dialog/isTotal', mPayload.Total === 'Y');

        try {
          oDialog = await this.openDialog(mPayload.Headty);

          const mSearchConditions = oViewModel.getProperty('/searchConditions');
          const sDetailEntity = _.chain(ChartsSetting.CHART_TYPE).find({ Headty: mPayload.Headty }).get('DetailEntity').value();
          const aDetailData = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), sDetailEntity, {
            ..._.set(mSearchConditions, 'Datum', moment(mSearchConditions.Datum).hours(9).toDate()),
            ..._.pick(mPayload, ['Headty', 'Discod']),
          });

          oViewModel.setProperty('/dialog/param', mPayload);
          oViewModel.setProperty('/dialog/rowCount', Math.min(aDetailData.length, 12));
          oViewModel.setProperty('/dialog/totalCount', _.size(aDetailData));
          oViewModel.setProperty(
            '/dialog/list',
            _.map(aDetailData, (o, i) => ({
              Idx: ++i,
              Navigable: 'O',
              ...o,
            }))
          );
        } catch (oError) {
          this.debug('Controller > m/overviewAttendance Main > callDetailPopup Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => oDialog.close(),
          });
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
          setTimeout(() => oDialog.getContent()[1].getItems()[0].setFirstVisibleRow(), 100);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onChangeWerks() {
        const oViewModel = this.getViewModel();

        try {
          const mAppointeeData = this.getAppointeeData();
          const aOrgehEntry = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'DashboardOrgList', {
            Werks: oViewModel.getProperty('/searchConditions/Werks'),
            Pernr: mAppointeeData.Pernr,
          });

          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointeeData.Orgeh) ? mAppointeeData.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));
        } catch (oError) {
          this.debug('Controller > m/overviewAttendance Main > onChangeWerks Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          this.setAllBusy(true);

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const mFilters = oViewModel.getProperty('/searchConditions');

          _.set(mFilters, 'Datum', moment(mFilters.Datum).hours(9).toDate());

          _.forEach(ChartsSetting.CHART_TYPE, (o) => {
            if (o.Device.includes('PC')) {
              this.buildChart(oModel, mFilters, o);
            }
          });
        } catch (oError) {
          this.debug('Controller > m/overviewAttendance Main > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressCount(oEvent) {
        this.callDetailPopup(oEvent.getSource().data());
      },

      onPressDetail1DialogClose() {
        this.oDetail1Dialog.close();
      },

      onPressDetail2DialogClose() {
        this.oDetail2Dialog.close();
      },

      onPressDetail3DialogClose() {
        this.oDetail3Dialog.close();
      },

      onPressDetail4DialogClose() {
        this.oDetail4Dialog.close();
      },
      onPressDetail5DialogClose() {
        this.oDetail5Dialog.close();
      },

      onPressEmployeeRow(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();
        // const sUsrty = this.isMss() ? 'M' : this.isHass() ? 'H' : '';
        const dSearchDate = moment(this.getViewModel().getProperty('/searchConditions/Datum'));

        window.open(`${sHost}#/individualWorkStateView/${mRowData.Pernr}/${dSearchDate.get('year')}/${dSearchDate.get('month')}`, '_blank', 'width=1650,height=800');
      },

      async onPressEmployee2Row(oEvent) {
        const oViewModel = this.getViewModel();
        let oDialog;

        oViewModel.setProperty('/dialog/busy', true);

        try {
          const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();

          oDialog = await this.openDialog('X2');

          const sDiscod = oViewModel.getProperty('/dialog/param/Discod');
          const sAwart = _.includes(['3', '4'], sDiscod) ? '2010' : '2000';
          const aDetailData = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'TimeOverviewDetail5', { ..._.pick(mRowData, ['Pernr', 'Begda', 'Endda']), Awart: sAwart });

          oViewModel.setProperty('/dialog/sub/rowCount', Math.min(aDetailData.length, 12));
          oViewModel.setProperty('/dialog/sub/totalCount', _.size(aDetailData));
          oViewModel.setProperty(
            '/dialog/sub/list',
            _.map(aDetailData, (o, i) => ({ Idx: ++i, ...o }))
          );
        } catch (oError) {
          this.debug('Controller > m/overviewAttendance Main > onPressEmployee2Row Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => oDialog.close(),
          });
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
        }
      },

      async onPressEmployee3Row(oEvent) {
        const oViewModel = this.getViewModel();
        let oDialog;

        oViewModel.setProperty('/dialog/busy', true);

        try {
          const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();

          oDialog = await this.openDialog('X1');

          const aDetailData = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'TimeOverviewDetail4', { ..._.pick(mRowData, ['Pernr', 'Begda', 'Endda']) });

          oViewModel.setProperty('/dialog/sub/rowCount', Math.min(aDetailData.length, 12));
          oViewModel.setProperty('/dialog/sub/totalCount', _.size(aDetailData));
          oViewModel.setProperty(
            '/dialog/sub/list',
            _.map(aDetailData, (o, i) => ({ Idx: ++i, ...o }))
          );
        } catch (oError) {
          this.debug('Controller > m/overviewAttendance Main > onPressEmployee3Row Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => oDialog.close(),
          });
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
        }
      },

      onPressDetailExcelDownload(oEvent) {
        const oTable = oEvent.getSource().getParent().getParent().getParent();
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_28040'); // 근태현황상세

        this.TableUtils.export({ oTable, sFileName });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
