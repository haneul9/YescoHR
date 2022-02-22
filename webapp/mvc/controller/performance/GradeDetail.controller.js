sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/performance/constant/Constants',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    UI5Error,
    TableUtils,
    BaseController,
    Constants
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.GradeDetail', {
      initializeModel() {
        return {
          busy: false,
          summary: {
            ZzapstsNm: '2차평가중',
            Orgtx2: '경영지원부문',
            ZzappgrTxt: '과장이상',
            list: [
              { Label: '배분율 Guide', TargetCnt: '32', VGCnt: '10', GDCnt: '22', NICnt: '0' },
              { Label: '평가부여현황', TargetCnt: '28', VGCnt: '11', GDCnt: '15', NICnt: '2' },
            ],
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          // const oView = this.getView();
          // const oListView = oView.getParent().getPage('container-ehr---m_performanceGrade');
          // if (_.isEmpty(oListView) || _.isEmpty(oListView.getModel().getProperty('/parameter/rowData'))) {
          //   throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          // }
          // const mParameter = _.chain(oListView.getModel().getProperty('/parameter/rowData')).cloneDeep().omit('__metadata').value();
          // const mDetailData = await Client.deep(this.getModel(ServiceNames.APPRAISAL), 'Appraisal2GDoc', {
          //   Menid: this.getCurrentMenuId(),
          //   Prcty: Constants.PROCESS_TYPE.DETAIL.code,
          //   ..._.pick(mParameter, ['Orgeh2', 'Zapcnt', 'Zzappgr', 'Zzapper', 'Zzappid', 'Zzapsts', 'ZzapstsSub', 'ZzapstsPSub']),
          //   Appraisal2GDocDetSet: [],
          //   Appraisal2GGradeSet: [],
          // });
          // this.setTableData({ oViewModel, aRowData });

          setTimeout(() => {
            TableUtils.setColorColumn({
              oTable: this.byId('summaryTable'),
              bIncludeHeader: true,
              mHeaderColorMap: { 2: 'bgType04', 3: 'bgType05', 4: 'bgType06' },
              mColorMap: { 2: 'bgType07', 3: 'bgType08', 4: 'bgType09' },
            });
          }, 100);
        } catch (oError) {
          this.debug(`Controller > m/performanceGrade Grade > onObjectMatched Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aRowData }) {
        const oTable = this.byId('gradeTable');

        oViewModel.setProperty('/list', aRowData);
        oViewModel.setProperty('/listInfo/rowCount', _.get(TableUtils.count({ oTable, aRowData }), 'rowCount', 1));
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = oViewModel.getProperty(sPath);

        if (!_.isEqual(oRowData.Godetl, 'X')) {
          MessageBox.alert(this.getBundleText('MSG_10006')); // 현재 평가상태에서는 상세내역을 조회하실 수 없습니다.
          return;
        }

        oViewModel.setProperty('/parameter/rowData', { ...oRowData });
        this.getRouter().navTo('m/performanceGrade-detail', { group: oRowData.Zzappgr });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
