sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    ServiceNames,
    ODataReadError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.familyInfo.FamilyInfo', {
      initializeModel() {
        return {
          busy: false,
          routeName: '',
          Data: [],
          SelectedRow: {},
          searchDate: {
            date: moment().hours(9).toDate(),
            secondDate: moment().subtract(1, 'month').add(1, 'day').hours(9).toDate(),
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
          Total: {
            isVisible: false,
          },
        };
      },

      onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/routeName', sRouteName);
        this.byId('familyTable').setSelectedIndex(-1);
        oViewModel.setProperty('/SelectedRow', {});

        this.onSearch();
        this.totalCount();
        this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
      },

      async callbackAppointeeChange() {
        this.onSearch();
        this.totalCount();
      },

      onClick() {
        const oViewModel = this.getViewModel();
        const mSelectRow = oViewModel.getProperty('/SelectedRow');
        const sRouteName = oViewModel.getProperty('/routeName');

        if (!_.isEmpty(mSelectRow) && mSelectRow.ZappStatAl !== '60') {
          MessageBox.alert(this.getBundleText('MSG_05008'));
          return;
        } else if (!_.isEmpty(mSelectRow) && mSelectRow.ZappStatAl === '60') {
          oViewModel.setProperty('/parameter', mSelectRow);
        } else {
          oViewModel.setProperty('/parameter', '');
        }

        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: 'N', status: mSelectRow.ZappStatAl });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR03';
      },

      formatNumber(vNum = '0') {
        return vNum;
      },

      formatPay(vPay = '0') {
        return this.TextUtils.toCurrency(vPay) || '0';
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_03012', sYear);
      },

      // table 체크박스
      onRowSelection(oEvent) {
        const oViewModel = this.getViewModel();
        const oEventSource = oEvent.getSource();
        const iSelectedIndex = oEventSource.getSelectedIndex();

        if (iSelectedIndex !== -1) {
          oEventSource.setSelectedIndex(iSelectedIndex);

          const oContext = oEvent.getParameter('rowContext');

          if (!!oContext) {
            oViewModel.setProperty('/SelectedRow', oViewModel.getProperty(oContext.getPath()));
          }
        } else {
          oViewModel.setProperty('/SelectedRow', {});
        }
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.PA);
        const oListModel = this.getViewModel();
        const oTable = this.byId('familyTable');
        const oSearchDate = oListModel.getProperty('/searchDate');
        const dDate = moment(oSearchDate.secondDate).hours(9).toDate();
        const dDate2 = moment(oSearchDate.date).hours(9).toDate();

        oListModel.setProperty('/busy', true);

        oModel.read('/FamilyInfoApplSet', {
          filters: [
            new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'), //
            new sap.ui.model.Filter('Pernr', sap.ui.model.FilterOperator.EQ, this.getAppointeeProperty('Pernr')),
            new sap.ui.model.Filter('Begda', sap.ui.model.FilterOperator.EQ, dDate),
            new sap.ui.model.Filter('Endda', sap.ui.model.FilterOperator.EQ, dDate2),
          ],
          success: (oData) => {
            if (oData) {
              const oList = oData.results;

              oListModel.setProperty('/FamilyList', oList);
              oListModel.setProperty('/listInfo', this.TableUtils.count({ oTable, aRowData: oList }));
              oListModel.setProperty('/listInfo/infoMessage', this.getBundleText('MSG_05005'));
              oListModel.setProperty('/busy', false);
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
            oListModel.setProperty('/busy', false);
          },
        });
      },

      totalCount() {
        const oModel = this.getModel(ServiceNames.PA);
        const oListModel = this.getViewModel();

        oModel.read('/FamInfoSummarySet', {
          filters: [
            new sap.ui.model.Filter('Pernr', sap.ui.model.FilterOperator.EQ, this.getAppointeeProperty('Pernr')), //
          ],
          success: (oData) => {
            if (oData) {
              const oList = oData.results[0];

              oListModel.setProperty('/Total', { ...oList, isVisible: _.isEqual(this.getAppointeeProperty('Werks'), '2000') });
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);
        const sRouteName = oListModel.getProperty('/routeName');

        oListModel.setProperty('/parameter', oRowData);
        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('familyTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_05001');

        this.TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
