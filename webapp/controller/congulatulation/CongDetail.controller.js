sap.ui.define(
    [
      'sap/ui/model/json/JSONModel',
      'sap/ui/core/Fragment',
      'sap/m/MessageBox',
      '../../model/formatter',
      '../BaseController',
    ],
    (
      JSONModel,
      Fragment,
      MessageBox,
      formatter,
      BaseController,
    ) => {
      'use strict';

      class CongDetail extends BaseController {
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
          this.getRouter().getRoute("congDetail").attachPatternMatched(this.onObjectMatched, this);
        }

        onAfterShow() {
          setTimeout(() => {
            this.getBenefitType(this);
          }, 150);
        }

        onNavBack() {
          window.history.go(-1);
        }

        onObjectMatched(oEvent) {
          const sDataKey = oEvent.getParameter("arguments").oDataKey;
          const oCommonModel = this.getModel();
          const sUrl = '/EmpLoginInfoSet';
          const oInfoModel = new JSONModel({
            FormData: {}
          });

          oCommonModel.read(sUrl, {
            success: (oData, oResponse) => {
              this.debug(`${sUrl} success.`, oData, oResponse);
              const oLoginInfo = oData.results[0];
              
              oInfoModel.setProperty("/FormData/Pernr", oLoginInfo);
              oInfoModel.setProperty("/FormData/Ename", oLoginInfo);
              oInfoModel.setProperty("/DetailTargetInfo", oLoginInfo);

              this.setViewModel(oInfoModel);

              if(sDataKey !== "N") {
                this.getTargetData(this, sDataKey);
              }
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);
            },
          });
        }
        
        // 상세조회
        getTargetData(oController, sDataKey) {
          const oModel = oController.getModel("benefit");
          const oDetailModel= oController.getViewModel();

          oModel.read("/ConExpenseApplSet", {
            async: false,
            filters: [
              new sap.ui.model.Filter("Prcty", sap.ui.model.FilterOperator.EQ, "D"),
              new sap.ui.model.Filter("Actty", sap.ui.model.FilterOperator.EQ, "E"),
              new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty("/DetailTargetInfo/Pernr")),
              new sap.ui.model.Filter("Appno", sap.ui.model.FilterOperator.EQ, sDataKey),
            ],
            success: function (oData) {
              if (oData) {
                // Common.log(oData);
                const oTargetData = oData.results[0];

                oDetailModel.setProperty("/FormData", oTargetData);
                oDetailModel.setProperty("/ApplyInfo", oTargetData);
                oDetailModel.setProperty("/PaymentDetails", oTargetData);
              }
            },
            error: function (oRespnse) {
              // Common.log(oResponse);
            }
          });
        }
          
        // 경조유형
        getBenefitType(oController) {
          const oModel = this.getModel("benefit");
          const oDetailModel = this.getViewModel();

          oModel.read("/BenefitCodeListSet", {
            async: false,
            filters: [
              new sap.ui.model.Filter("Cdnum", sap.ui.model.FilterOperator.EQ, "BE0001"),
              new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, '1000'),
              new sap.ui.model.Filter("Datum", sap.ui.model.FilterOperator.EQ, new Date()),
            ],
            success: function (oData) {
              if (oData) {
                oDetailModel.setProperty('/BenefitType', oData.results);

                setTimeout(() => {
                  oController.onTypeChange();
                }, 150);
              }
            },
            error: function (oRespnse) {
              // Common.log(oResponse);
            }
          });
        }

        // 경조유형 선택시
        onTypeChange(oEvent) {
          const oModel = this.getModel("benefit");
          const oController = this;
          const oDetailModel = this.getViewModel();
          const sSelectKey = oEvent ? oEvent.getSource().getSelectedKey() : oDetailModel.getProperty('/FormData/Concode');
          let sSelectText = "";

          if(!oEvent) {
            oDetailModel.getProperty("/BenefitType").forEach((e) => {
              if(sSelectKey === e.Zcode) sSelectText = e.Ztext;
            });
          }else
            sSelectText = oEvent.getSource().getSelectedItem().getText();

          oDetailModel.setProperty('/FormData/Context', sSelectText);

          oModel.read("/BenefitCodeListSet", {
            async: true,
            filters: [
              new sap.ui.model.Filter("Cdnum", sap.ui.model.FilterOperator.EQ, "BE0002"),
              new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, '1000'),
              new sap.ui.model.Filter("Datum", sap.ui.model.FilterOperator.EQ, new Date()),
              new sap.ui.model.Filter("Upcod", sap.ui.model.FilterOperator.EQ, sSelectKey),
            ],
            success: function (oData) {
              if (oData) {
                oDetailModel.setProperty('/BenefitCause', oData.results);
                oDetailModel.setProperty("/BenefitRelation", []);

                setTimeout(() => {
                  oController.onCauseChange();
                }, 200);
              }
            },
            error: function (oRespnse) {
              // Common.log(oResponse);
            }
          });
        }

        // 경조사유 선택시
        onCauseChange(oEvent) {
          const oModel = this.getModel("benefit");
          const oDetailModel = this.getViewModel();
          const sSelectKey = oEvent ? oEvent.getSource().getSelectedKey() : oDetailModel.getProperty('/FormData/Conresn');
          let sSelectText = "";

          if(!oEvent) {
            oDetailModel.getProperty("/BenefitCause").forEach((e) => {
              if(sSelectKey === e.Zcode) sSelectText = e.Ztext;
            });
          }else
            sSelectText = oEvent.getSource().getSelectedItem().getText();

          oDetailModel.setProperty('/FormData/Conretx', sSelectText);

          if(oEvent) this.getNomalPay(this);

          oModel.read("/BenefitCodeListSet", {
            async: false,
            filters: [
              new sap.ui.model.Filter("Cdnum", sap.ui.model.FilterOperator.EQ, "BE0003"),
              new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, '1000'),
              new sap.ui.model.Filter("Datum", sap.ui.model.FilterOperator.EQ, new Date()),
              new sap.ui.model.Filter("Upcod", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/FormData/Concode')),
              new sap.ui.model.Filter("Upcod2", sap.ui.model.FilterOperator.EQ, sSelectKey),
            ],
            success: function (oData) {
              if (oData) {
                oDetailModel.setProperty('/BenefitRelation', oData.results);
              }
            },
            error: function (oRespnse) {
              // Common.log(oResponse);
            }
          });
        }

        // 증빙상 경조일 선택시
        onBenefitChangeDate() {
          this.getNomalPay(this);
        }

        // 기본급, 지급율 등 받아옴
        getNomalPay(oController) {
          const oModel = this.getModel("benefit");
          const oDetailModel = this.getViewModel();

          oModel.read("/ConExpenseCheckListSet", {
            async: false,
            filters: [
              new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, '1000'),
              new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty("/DetailTargetInfo/Pernr")),
              new sap.ui.model.Filter("Concode", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/FormData/Concode')),
              new sap.ui.model.Filter("Conresn", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/FormData/Conresn')),
              new sap.ui.model.Filter("Conddate", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/FormData/Conddate')),
            ],
            success: function (oData) {
              if (oData) {
                const oPay = oData.results[0];
                
                oDetailModel.setProperty('/FormData/ZbacBet', oPay.ZbacBet);
                oDetailModel.setProperty('/FormData/ZbacBetT', oPay.ZbacBetT);
                oDetailModel.setProperty('/FormData/Payrt', oPay.Payrt);
                oDetailModel.setProperty('/FormData/PayrtT', oPay.PayrtT);
                oDetailModel.setProperty('/FormData/ZpayBetT', oPay.ZpayBetT);
                oDetailModel.setProperty('/FormData/ZpayBet', oPay.ZpayBet);
                oDetailModel.setProperty('/FormData/Zflower', oPay.Zflower);
                oDetailModel.setProperty('/FormData/Zemp', oPay.Zemp);
              }
            },
            error: function (oRespnse) {
              // Common.log(oResponse);
            }
          });
        }

        // 대상자 성명 선택시
        onTargetDialog() {
          const oDetailModel = this.getViewModel();

          this.getTargetList(this);

          setTimeout(() => {
            if(oDetailModel.getProperty('/TargetList').length === 1) return;
                // load asynchronous XML fragment
            if (!this.byId('targetSettingsDialog')) {
              Fragment.load({
                id: this.getView().getId(),
                name: 'sap.ui.yesco.view.congulatulation.TargetDialog',
                controller: this,
              }).then((oDialog) => {
                // connect dialog to the root view of this component (models, lifecycle)
                this.getView().addDependent(oDialog);
                oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                oDialog.open();
              });
            } else {
              this.byId('targetSettingsDialog').open();
            }
          }, 150);
        }
        
        // 대상자 리스트 조회
        getTargetList(oController) {
          const oModel = this.getModel("benefit");
          const oDetailModel = this.getViewModel();

          oModel.read("/ConExpenseSupportListSet", {
            async: true,
            filters: [
              new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, '1000'),
              new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty("/DetailTargetInfo/Pernr")),
              new sap.ui.model.Filter("Concode", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/FormData/Concode')),
              new sap.ui.model.Filter("Conresn", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/FormData/Conresn')),
              new sap.ui.model.Filter("Datum", sap.ui.model.FilterOperator.EQ, new Date()),
            ],
            success: function (oData) {
              if (oData) {
                const oTargetList = oData.results;
                
                oDetailModel.setProperty('/TargetList', oTargetList);

                if(oTargetList.length === 1) {
                  oDetailModel.setProperty("/FormData/Zbirthday", oTargetList[0].Zbirthday);
                  oDetailModel.setProperty("/FormData/Kdsvh", oTargetList[0].Kdsvh);
                  oDetailModel.setProperty("/FormData/Zname", oTargetList[0].Zname);
                }else 
                  oController.byId("targetTable").setVisibleRowCount(oTargetList.length);
              }
            },
            error: function (oRespnse) {
              // Common.log(oResponse);
            }
          });
        }

        // Dialog 대상자 클릭
        TargetClick(oEvent) {
          const vPath = oEvent.getParameters().rowBindingContext.getPath();
          const oDetailModel = this.getViewModel();
          const oRowData = oDetailModel.getProperty(vPath);

          oDetailModel.setProperty("/FormData/Zbirthday", oRowData.Zbirthday);
          oDetailModel.setProperty("/FormData/Kdsvh", oRowData.Kdsvh);
          oDetailModel.setProperty("/FormData/Zname", oRowData.Zname);
          this.byId('targetSettingsDialog').close();
        }

        //  대상자 성명 Dialog 닫기클릭
        onClick() {
          this.byId('targetSettingsDialog').close();
        }

        checkError(oController) {
          const oDetailModel = oController.getViewModel();
    
          // 대상자 생년월일
          if(!oDetailModel.getProperty('/FormData/Zbirthday')) {
            MessageBox.error("대상자 생년월일을 선택하세요.", { title: "안내"});
            return true;
          }
    
          // 증빙상 경조일
          if(!oDetailModel.getProperty('/FormData/Conddate')) {
            MessageBox.error("증빙상 경조일을 선택하세요.", { title: "안내"});
            return true;
          }
    
          // 실재 경조일
          if(!oDetailModel.getProperty('/FormData/Conrdate')) {
            MessageBox.error("실재 경조일을 선택하세요.", { title: "안내"});
            return true;
          }
    
          // 대상자 성명
          if(!oDetailModel.getProperty('/FormData/Zname')) {
            MessageBox.error("대상자 성명을 입력하세요.", { title: "안내"});
            return true;
          }
    
          // 행사장소
          if(!oDetailModel.getProperty('/FormData/Zeloc')) {
            MessageBox.error("행사장소를 입력하세요.", { title: "안내"});
            return true;
          }
    
          return false;
        }

        // 재작성
        onRewriteBtn() {
          this.getViewModel().setProperty('/FormData/ZappStatAl', '10');
        }

        // 임시저장
        onSaveBtn() {
          const oModel = this.getModel("benefit");
          const oDetailModel = this.getViewModel();
          const oController = this;

          if(this.checkError(this)) return;
          
          const onPressSave = function (fVal) {
            if (fVal && fVal === "저장") {
              let oSendObject = {};

              oSendObject = oDetailModel.getProperty("/FormData");
              oSendObject.Prcty = 'T';
              oSendObject.Pernr = oDetailModel.getProperty("/DetailTargetInfo/Pernr");
              oSendObject.Actty = 'E';

              oModel.create("/ConExpenseApplSet", oSendObject, {
                async: false,
                success: function (oData) {
                  MessageBox.alert("저장되었습니다.", { title: "안내"});
                  oController.getRouter().navTo("congulatulation");
                },
                error: function (oRespnse) {
                  // Common.log(oResponse);
                }
              })
            }
          }

          MessageBox.confirm("저장 하시겠습니까?", {
            title: "경조금 신청",
            actions: ["저장", "취소"],
            onClose: onPressSave
          });
        }

        // 신청
        onApplyBtn() {
          const oModel = this.getModel("benefit");
          const oDetailModel = this.getViewModel();
          const oController = this;
          
          if(this.checkError(this)) return;

          const onPressApply = function (fVal) {
            if (fVal && fVal === "신청") {
              let oSendObject = {};
              const vStatus = oDetailModel.getProperty('/FormData/ZappStatAl');

              oSendObject = oDetailModel.getProperty("/FormData");
              oSendObject.Prcty = 'C';
              oSendObject.Pernr = oDetailModel.getProperty("/DetailTargetInfo/Pernr");
              oSendObject.Actty = 'E';
              oSendObject.Appno = !vStatus || vStatus === '45' ? '' : oDetailModel.getProperty('/FormData/Appno');

              oModel.create("/ConExpenseApplSet", oSendObject, {
                async: false,
                success: function (oData) {
                  MessageBox.alert("신청되었습니다.", { title: "안내"});
                  oController.getRouter().navTo("congulatulation");
                },
                error: function (oRespnse) {
                  // Common.log(oResponse);
                }
              })
            }
          }

          MessageBox.confirm("신청 하시겠습니까?", {
            title: "경조금 신청",
            actions: ["신청", "취소"],
            onClose: onPressApply
          });
        }

        // 취소
        onCancelBtn() {
          const oModel = this.getModel("benefit");
          const oDetailModel = this.getViewModel();
          const oController = this;
          
          const onPressSave = function (fVal) {
            if (fVal && fVal === "확인") {
              let oSendObject = {};

              oSendObject = oDetailModel.getProperty("/FormData");
              oSendObject.Prcty = 'W';
              oSendObject.Pernr = oDetailModel.getProperty("/DetailTargetInfo/Pernr");
              oSendObject.Actty = 'E';

              oModel.create("/ConExpenseApplSet", oSendObject, {
                async: false,
                success: function () {
                  MessageBox.alert("신청이 취소되었습니다.", { title: "안내"});
                  oController.getRouter().navTo("congulatulation");
                },
                error: function (oRespnse) {
                  // Common.log(oResponse);
                }
              })
            }
          }

          MessageBox.confirm("취소 하시겠습니까?", {
            title: "경조금 신청",
            actions: ["확인", "취소"],
            onClose: onPressSave
          });
        }

        // 삭제
        onDeleteBtn() {
          const oModel = this.getModel("benefit");
          const oDetailModel = this.getViewModel();
          const oController = this;
          
          
          const onPressApply = function (fVal) {
            if (fVal && fVal == "삭제") {
              const sPath = oModel.createKey("/ConExpenseApplSet", {
                Appno: oDetailModel.getProperty('/FormData/Appno')
              });
              
              oModel.remove(sPath, {
                async: false,
                success: function () {
                  MessageBox.alert("삭제되었습니다.", { title: "안내"});
                  oController.getRouter().navTo("congulatulation");
                },
                error: function (oRespnse) {
                  // Common.log(oResponse);
                }
              })
            }
          }

          MessageBox.confirm("삭제 하시겠습니까?", {
            title: "경조금 신청",
            actions: ["삭제", "취소"],
            onClose: onPressApply
          });
        }
      }
      
      return CongDetail;
    }
  );
  