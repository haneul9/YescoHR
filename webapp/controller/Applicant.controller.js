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

        class Applicant extends BaseController {
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

            setAppdt(vAppdt) {
                if(vAppdt) 
                  return `${vAppdt.slice(0, 4)}.${vAppdt.slice(4, 6)}.${vAppdt.slice(6, 8)}, ${vAppdt.slice(9, 11)}:${vAppdt.slice(11, 13)}`;
          
                return "";
            }
        }
      
      return Applicant;
    }
  );
  