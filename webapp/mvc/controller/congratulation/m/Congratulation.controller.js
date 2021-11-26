sap.ui.define(
    [
      'sap/m/library', // prettier 방지용 주석
      'sap/ui/model/json/JSONModel',
      'sap/ui/core/Fragment',
      '../../../model/formatter',
      '../../BaseController',
    ],
    (
      mobileLibrary, // prettier 방지용 주석
      JSONModel,
      Fragment,
      formatter,
      BaseController,
    ) => {
      'use strict';

      class Congratulation extends BaseController {

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
          const oListModel = new JSONModel({
            Data: []
          });
          const oSearchDate = this.byId('SearchDate');
          const dDate = new Date();
          const dDate2 = new Date(dDate.getFullYear(), dDate.getMonth() - 1, dDate.getDate() + 1);
          
          this.setViewModel(oListModel);
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

        formatStatusTxt(vStatus) {
          Indication02
        }

        getPayComma(vPay) {
          if(vPay) return `${vPay}만원`;

          return '';
        }

        getTotalPay() {
          const oModel = this.getModel("benefit");
          const oTotalModel = this.getViewModel();
          const oController = this;

          oModel.read("/ConExpenseMyconSet", {
            async: false,
            filters: [
							new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, "50006"),
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
							new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, "50006"),
						],
            success: function (oData) {
              if (oData) {
                // Common.log(oData);
                const oList = oData.results;
                let vNo = 0;

                oList.forEach(e =>{
                  vNo = vNo + 1;
                  e.No = vNo;
                });
                
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

      return Congratulation;
    }
  );
  