sap.ui.define(
    [
      'sap/m/library', // prettier 방지용 주석
      'sap/ui/model/json/JSONModel',
      'sap/ui/core/Fragment',
      'sap/m/MessageBox',
      './BaseController',
    ],
    (
      mobileLibrary, // prettier 방지용 주석
      JSONModel,
      Fragment,
      MessageBox,
      BaseController,
    ) => {
      'use strict';

        class ApprovalDetails extends BaseController {
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
            }

            onAfterShow() {
            }
        }
      
      return ApprovalDetails;
    }
  );
  