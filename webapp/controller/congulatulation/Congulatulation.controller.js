sap.ui.define(
    [
      'sap/m/library', // prettier 방지용 주석
      'sap/ui/model/json/JSONModel',
      'sap/ui/core/Fragment',
      '../../model/formatter',
      '../BaseController',
    ],
    (
      mobileLibrary, // prettier 방지용 주석
      JSONModel,
      Fragment,
      formatter,
      BaseController,
    ) => {
      'use strict';
      return BaseController.extend('sap.ui.yesco.controller.congulatulation.Congulatulation', {
        onInit() {
            const oSearchDate = this.byId('SearchDate');
            const dDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate() + 1);
            
            oSearchDate.setDateValue(dDate);
            oSearchDate.setSecondDateValue(new Date());
        },

        onClick() {
          if (!this.byId('detailDialog')) {
            Fragment.load({
              id: this.getView().getId(),
              name: 'sap.ui.yesco.view.congulatulation.DetailDialog',
              controller: this,
            }).then((oDialog) => {
              // connect dialog to the root view of this component (models, lifecycle)
              this.getView().addDependent(oDialog);
              // oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
              oDialog.open();
            });
          } else {
            this.byId('detailDialog').open();
          }
        },

        onSearch() {
            // const model = this.getOwnerComponent().getModel("benefit");
          // model.metadataLoaded().then(this.onSearch);
          // model.attachMetadataFailed(onSearch);
          const oModel = this.getModel("benefit");
          const oSearchDate = this.byId('SearchDate');

          // const sPath = oModel.createKey("/ConExpenseApplSet", {
          //   Prcty: ,
          //   Actty: ,
          //   Apbeg: oSearchDate.getDateValue(),
          //   Apend: oSearchDate.getSecondDateValue(),
          //   Pernr: ,
          // });

          oModel.read("/ConExpenseApplSet", {
            async: false,
            filters: [
							new sap.ui.model.Filter("Prcty", sap.ui.model.FilterOperator.EQ, "L"),
							new sap.ui.model.Filter("Actty", sap.ui.model.FilterOperator.EQ, "E"),
							new sap.ui.model.Filter("Apbeg", sap.ui.model.FilterOperator.EQ, oSearchDate.getDateValue()),
							new sap.ui.model.Filter("Apend", sap.ui.model.FilterOperator.EQ, oSearchDate.getSecondDateValue()),
							new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, "500006"),
						],
            success: function (oData) {
              if (oData) {
                // Common.log(oData);
              }
            },
            error: function (oResponse) {
              // Common.log(oResponse);
            }
          });
        },
      });
    }
  );
  