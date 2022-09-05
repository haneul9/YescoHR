sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.csr.csr', {
      initializeModel() {
        return {
          busy: false,
          routeName: '',
          LoanType: [],
          TargetCode: {},
          parameters: {},
          search: {
            Werks: this.getAppointeeProperty('Werks'),
            date: moment().hours(9).toDate(),
            secondDate: moment().startOf('year').hours(9).toDate(),
          },
          listInfo: {
            Title: this.getBundleText("LABEL_46016"), // 상세내역
            isShowProgress: false,
            isShowApply: true,
            isShowApprove: true,
            isShowReject: false,
            isShowComplete: true,
            ObjTxt2: this.getBundleText('LABEL_46001'), // 신청단계
            ObjTxt3: this.getBundleText('LABEL_46002'), // 처리단계
            ObjTxt5: this.getBundleText('LABEL_46003'), // 완료단계
            rowCount: 3,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
          List: [],
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);
          oListModel.setProperty('/routeName', sRouteName);

          await this.readList();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          // this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
          oListModel.setProperty('/busy', false);
        }
      },

      async callbackAppointeeChange() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          // await this.readList();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onClick() {
        const sRouteName = this.getViewModel().getProperty('/routeName');
        const sWerks = this.getViewModel().getProperty('/search/Werks');

        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: 'N', werks: sWerks });
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          await this.readList();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      async readList() {
        try {
          const oListModel = this.getViewModel();
          const oModel = this.getModel(ServiceNames.COMMON);
          const oSearch = oListModel.getProperty('/search');

          const aTableList = await Client.getEntitySet(oModel, 'CsrRequest', {
            Austy: 'H',
            Werks: oSearch.Werks,
            Begda: moment(oSearch.secondDate).hours(9).toDate(),
            Endda: moment(oSearch.date).hours(9).toDate(),
          });

          oListModel.setProperty('/List', aTableList);

          const iVisibleRowCountLimit = this.TableUtils.calculateVisibleRowCount(this.byId('Table'));
          const iDataLength = aTableList.length;
          const oOccurCount = _.chain(aTableList)
            .map('Prstg')
            .countBy()
            .defaults({
              ['']: 0,
              ['10']: 0,
              ['20']: 0,
              ['30']: 0
            })
            .value();
          
          oListModel.setProperty('/listInfo', {
            rowCount: Math.min(iVisibleRowCountLimit, iDataLength),
            totalCount: aTableList.length,
            applyCount: oOccurCount['10'],
            approveCount: oOccurCount['20'],
            completeCount: oOccurCount['30'],
            Title: this.getBundleText("LABEL_46016"), // 상세내역
            isShowProgress: false,
            isShowApply: true,
            isShowApprove: true,
            isShowReject: false,
            isShowComplete: true,
            ObjTxt2: this.getBundleText('LABEL_46001'), // 신청단계
            ObjTxt3: this.getBundleText('LABEL_46002'), // 처리단계
            ObjTxt5: this.getBundleText('LABEL_46003'), // 완료단계
          });
        } catch (oError) {
          throw oError;
        }
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);
        const sRouteName = oListModel.getProperty('/routeName');

        oListModel.setProperty('/parameters', oRowData);
        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: oRowData.Appno, werks: oRowData.Werks });
      },

      onPressExcelDownload() {
        const oTable = this.byId('Table');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_46000'); // CSR_목록

        this.TableUtils.export({ oTable, sFileName });
      },

      rowHighlight(sValue) {
        const vValue = !parseInt(sValue, 10) ? sValue : parseInt(sValue, 10);

        switch (vValue) {
          case 10:
            // 신청
            return sap.ui.core.IndicationColor.Indication03;
          case 20:
            // 승인
            return sap.ui.core.IndicationColor.Indication04;
          case 30:
            // 완료
            return sap.ui.core.IndicationColor.Indication05;
          default:
            return null;
        }
      },

    });
  }
);
