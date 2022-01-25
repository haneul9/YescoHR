sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/GroupDialogHandler',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    TableUtils,
    GroupDialogHandler,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.leaveSummary.App', {
      TableUtils: TableUtils,
      TABLE_ID: 'leaveSummaryTable',

      GroupDialogHandler: null,

      onBeforeShow() {
        this.GroupDialogHandler = new GroupDialogHandler(this, ([mOrgData]) => {
          const oViewModel = this.getViewModel();

          oViewModel.setProperty('/search/Orgeh', mOrgData.Orgeh);
          oViewModel.setProperty('/search/Orgtx', mOrgData.Stext);
        });

        const today = moment();
        const oViewModel = new JSONModel({
          busy: false,
          search: {
            Plnyy: today.format('YYYY'),
            Seqno: '',
            Orgeh: '',
            Orgtx: '',
          },
          entry: {
            YearList: [],
            SeqnoList: [],
          },
          summary: {
            infoText: this.getBundleText('LABEL_23012', '2021.01.01~2021.12.31'),
            dataSources: {
              chart: {
                showLegend: '0',
                showValues: '0',
                showLabels: '0',
                showPercentInTooltip: '0',
                showToolTipShadow: '0',
                slicingDistance: '5',
                formatNumber: '1',
                formatNumberScale: false,
                decimals: '1',
                useDataPlotColorForLabels: '1',
                theme: 'ocean',
                paletteColors: '#97C4EF,#FFE479,#A1E094,#FE827D',
              },
              data: [
                {
                  label: this.getBundleText('LABEL_23013'), // 미입력
                  value: '0',
                  isSliced: '1',
                },
                {
                  label: this.getBundleText('LABEL_00121'), // 신청
                  value: '0',
                  isSliced: '0',
                },
                {
                  label: this.getBundleText('LABEL_00123'), // 승인
                  value: '0',
                  isSliced: '0',
                },
                {
                  label: this.getBundleText('LABEL_00124'), // 반려
                  value: '0',
                  isSliced: '0',
                },
              ],
            },
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            isShowProgress: true,
            progressCount: 0,
            isShowApply: false,
            applyCount: 0,
            isShowApprove: true,
            approveCount: 0,
            isShowReject: true,
            rejectCount: 0,
            isShowComplete: false,
            completeCount: 0,
            infoMessage: this.getBundleText('LABEL_23010', '2021.01.01~2021.12.31'),
          },
          list: [],
        });
        this.setViewModel(oViewModel);

        TableUtils.adjustRowSpan({
          oTable: this.byId(this.TABLE_ID),
          aColIndices: [0, 1, 2, 3, 4, 15],
          sTheadOrTbody: 'thead',
        });
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const fCurried = Client.getEntitySet(this.getModel(ServiceNames.WORKTIME));
          const sWerks = this.getAppointeeProperty('Werks');

          const aPlanYear = await fCurried('HolPlanYear', { Werks: sWerks });
          const aPlanSeqnr = await fCurried('HolPlanSeqnr', { Werks: sWerks, Plnyy: _.get(aPlanYear, [0, 'Plnyy'], _.noop()) });

          const mSearch = oViewModel.getProperty('/search');
          _.chain(mSearch)
            .set('Plnyy', _.get(aPlanYear, [0, 'Plnyy'], 'ALL'))
            .set('Seqno', _.chain(aPlanSeqnr).find({ Curyn: 'X' }).get('Seqno', 'ALL').value())
            .set('Orgeh', this.getAppointeeProperty('Orgeh'))
            .set('Orgtx', this.getAppointeeProperty('Orgtx'))
            .commit();

          const mEntry = oViewModel.getProperty('/entry');
          _.chain(mEntry)
            .set('YearList', new ComboEntry({ codeKey: 'Plnyy', valueKey: 'Plnyy', aEntries: aPlanYear }) ?? [])
            .set('SeqnoList', new ComboEntry({ codeKey: 'Seqno', valueKey: 'Seqno', aEntries: aPlanSeqnr }) ?? [])
            .commit();

          this.onPressSearch();
        } catch (oError) {
          this.debug('Controller > leaveSummary App > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async setHolPlanSeqno() {
        const oViewModel = this.getViewModel();
        const sPlnyy = oViewModel.getProperty('/search/Plnyy');

        if (_.isEqual(sPlnyy, 'ALL')) return;

        const aSeqno = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'HolPlanSeqnr', {
          Werks: this.getAppointeeProperty('Werks'),
          Plnyy: sPlnyy,
        });

        oViewModel.setProperty('/search/Seqno', _.chain(aSeqno).find({ Curyn: 'X' }).get('Seqno', 'ALL').value());
        oViewModel.setProperty('/entry/SeqnoList', new ComboEntry({ codeKey: 'Seqno', valueKey: 'Seqno', aEntries: aPlanSeqnr }) ?? []);
      },

      buildChart() {
        const mDataSource = this.getViewModel().getProperty('/summary/dataSources');

        FusionCharts.ready(function () {
          new FusionCharts({
            type: 'pie2d',
            renderAt: 'chart-container',
            width: '180',
            height: '160',
            dataFormat: 'json',
            dataSource: mDataSource,
          }).render();
        });
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressSearchOrgeh() {
        this.GroupDialogHandler.openDialog();
      },

      onFileView(oEvent) {
        const sUrl = oEvent.getSource().data('url');

        if (_.isEmpty(sUrl)) return;
        window.open(sUrl, '_blank');
      },

      onChangePlnyy() {
        this.setHolPlanSeqno();
      },

      async onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const mSearch = oViewModel.getProperty('/search');
          const sWerks = this.getAppointeeProperty('Werks');
          const fCurried = Client.getEntitySet(this.getModel(ServiceNames.WORKTIME));
          const mFilter = { Werks: sWerks, ..._.omit(mSearch, 'Orgtx') };

          const [[mSummary], aPlanList] = await Promise.all([
            fCurried('HolPlanSummary', mFilter), //
            fCurried('HolPlanList', mFilter),
          ]);

          const oTable = this.byId(this.TABLE_ID);
          const oListInfo = oViewModel.getProperty('/listInfo');

          oViewModel.setProperty('/list', aPlanList ?? []);
          oViewModel.setProperty('/listInfo', {
            ...oListInfo,
            infoMessage: this.getBundleText('LABEL_23010', _.get(mSummary, 'Tmprd')),
            ...TableUtils.count({ oTable, aRowData: aPlanList }),
          });

          const mViewSummary = oViewModel.getProperty('/summary');
          _.chain(mViewSummary)
            .set('infoText', this.getBundleText('LABEL_23012', _.get(mSummary, 'Tmprd')))
            .set(['dataSources', 'data', 0, 'value'], _.get(mSummary, 'Cnt01', 0))
            .set(['dataSources', 'data', 1, 'value'], _.get(mSummary, 'Cnt03', 0))
            .set(['dataSources', 'data', 2, 'value'], _.get(mSummary, 'Cnt04', 0))
            .set(['dataSources', 'data', 3, 'value'], _.get(mSummary, 'Cnt05', 0))
            .assign(_.pickBy(mSummary, (v, p) => _.startsWith(p, 'Cnt')))
            .commit();

          this.buildChart();
        } catch (oError) {
          this.debug('Controller > leaveSummary App > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onSelectRow(oEvent) {
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(sPath);
        const [mAppointee] = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
          Ename: oRowData.Pernr,
        });

        this.getAppointeeModel().setData({ ...mAppointee, showChangeButton: false });

        this.getRouter().navTo('leavePlan', _.pick(oRowData, ['Plnyy', 'Seqno']));
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.TABLE_ID);
        const aTableData = this.getViewModel().getProperty('/list');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_23015'); // {연간휴가계획현황}_목록

        TableUtils.export({ oTable, aTableData, sFileName, aDateProps: [], bHasMultiLabel: true });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
