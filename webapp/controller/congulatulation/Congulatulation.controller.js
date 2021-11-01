sap.ui.define(
    [
      'sap/m/library', // prettier 방지용 주석
      'sap/ui/model/json/JSONModel',
      'sap/ui/core/Fragment',
      '../../model/formatter',
      '../../common/EmpInfo',
      '../BaseController',
    ],
    (
      mobileLibrary, // prettier 방지용 주석
      JSONModel,
      Fragment,
      formatter,
      EmpInfo,
      BaseController,
    ) => {
      'use strict';

      class Congulatulation extends BaseController {
        constructor() {
          super();
          this.formatter = formatter;
        }

        onInit() {
          this.getView().addEventDelegate(
            {
                onBeforeShow: this.onBeforeShow,
                onAfterShow: this.onAfterShow
            },
            this
          );
        }

        onBeforeShow() {
          const oViewModel = new JSONModel();
          this.setViewModel(oViewModel);

          EmpInfo.getInfo.call(this, 'o');
          
          const oSearchDate = this.byId('SearchDate');
          const dDate = new Date();
          const dDate2 = new Date(dDate.getFullYear(), dDate.getMonth() - 1, dDate.getDate() + 1);
          
          oSearchDate.setDateValue(dDate2);
          oSearchDate.setSecondDateValue(dDate);
        }

        onAfterShow() {
          this.onSearch();
          this.getTotalPay();
        }
      
        rowHighlight(sValue) {
          switch (sValue) {
            case "10":
            case "90":
              return sap.ui.core.IndicationColor.Indication01;
            case "20":
            case "30":
            case "50":
              return sap.ui.core.IndicationColor.Indication03;
            case "40":
              return sap.ui.core.IndicationColor.Indication04;
            case "45":
            case "65":
              return sap.ui.core.IndicationColor.Indication02;
            case "60":
              return sap.ui.core.IndicationColor.Indication05;
            default:
              return null;
          }
        }

        onClick() {
          this.getRouter().navTo("congDetail", {oDataKey: "N"});
        }

        formatNumber(vNum) {
          if(!vNum || vNum === '') return '0';

          return vNum;
        }

        formatPay(vPay) {
          if(!vPay || vPay === '0') return '0';

          return `${vPay}만원`;
        }

        getTotalPay() {
          const oModel = this.getModel("benefit");
          const oTotalModel = this.getViewModel();

          oModel.read("/ConExpenseMyconSet", {
            async: false,
            filters: [
							new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, oTotalModel.getProperty("/TargetInfo/Pernr")),
						],
            success: function (oData) {
              if (oData) {
                // Common.log(oData);
                const oTotal = oData.results[0];

                oTotalModel.setProperty("/Total", oTotal);
              }
            },
            error: function (oRespnse) {
              // Common.log(oResponse);
            }
          });
        }

        onSearch() {
          const oModel = this.getModel("benefit");
          const oSearchDate = this.byId('SearchDate');
          const oListModel = this.getViewModel();
          const oController = this;

          oModel.read("/ConExpenseApplSet", {
            async: false,
            filters: [
							new sap.ui.model.Filter("Prcty", sap.ui.model.FilterOperator.EQ, "L"),
							new sap.ui.model.Filter("Actty", sap.ui.model.FilterOperator.EQ, "E"),
							new sap.ui.model.Filter("Apbeg", sap.ui.model.FilterOperator.EQ, oSearchDate.getDateValue()),
							new sap.ui.model.Filter("Apend", sap.ui.model.FilterOperator.EQ, oSearchDate.getSecondDateValue()),
							new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, oListModel.getProperty("/TargetInfo/Pernr")),
						],
            success: function (oData) {
              if (oData) {
                // Common.log(oData);
                const oList = oData.results;
                let vNo = 0;
                let vNum1 = 0;
                let vNum2 = 0;
                let vNum3 = 0;
                let vNum4 = 0;
                let vNum5 = 0;

                oList.forEach(e =>{
                  vNo = vNo + 1;
                  e.No = vNo;
                });

                oList.forEach(e => {
                  switch(e.ZappStatAl) {
                    case "10":
                    case "90":
                      return vNum1 = vNum1 + 1;
                    case "20":
                    case "30":
                    case "50":
                      return vNum2 = vNum2 + 1;
                    case "40":
                      return vNum3 = vNum3 + 1;
                    case "45":
                    case "65":
                      return vNum4 = vNum4 + 1;
                    case "60":
                      return vNum5 = vNum5 + 1;
                    default:
                      return null;
                  }
                });
                
                oListModel.setProperty('/Writing', `작성중 ${vNum1}`);
                oListModel.setProperty('/Apply', `신청 ${vNum2}`);
                oListModel.setProperty('/Approval', `승인 ${vNum3}`);
                oListModel.setProperty('/Reject', `반려 ${vNum4}`);
                oListModel.setProperty('/Complete', `완료 ${vNum5}`);
                oListModel.setProperty('/CongList', oList);
                oController.byId("conguTable").setVisibleRowCount(oList.length);
              }
            },
            error: function (oRespnse) {
              // Common.log(oResponse);
            }
          });
        }

        onSelectRow(oEvent) {
          const vPath = oEvent.getParameters().rowBindingContext.getPath();
          const oRowData = this.getViewModel().getProperty(vPath);
          
          this.getRouter().navTo("congDetail", {oDataKey: oRowData.Appno});
        }
      }

      return Congulatulation;
    }
  );
  