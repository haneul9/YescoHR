/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    TextUtils,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.educationHistory.EducationHistoryDetail', {
      TextUtils: TextUtils,
      TableUtils: TableUtils,

      initializeModel() {
        return {
          FormData: {},
          busy: false,
        };
      },

      eduPeriod(v1 = moment().toDate(), v2 = moment().toDate()) {
        v1 = moment(v1).format('YYYY.MM.DD');
        v2 = moment(v2).format('YYYY.MM.DD');
        return `${v1} ~ ${v2}`;
      },

      // setData
      async onObjectMatched() {
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());

        try {
          oDetailModel.setProperty('/busy', true);

          const sPageId = this.isHass() ? 'container-ehr---h_educationHistory' : 'container-ehr---educationHistory';
          const oView = this.getView();
          const oListView = oView.getParent().getPage(sPageId);
          const mParameters = oListView.getModel().getProperty('/parameters');

          oDetailModel.setProperty('/FormData', mParameters);
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      getCurrentLocationText() {
        return this.getBundleText('LABEL_00165');
      },
    });
  }
);
