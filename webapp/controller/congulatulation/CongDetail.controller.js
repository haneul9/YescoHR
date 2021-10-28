sap.ui.define(
    [
      'sap/m/library', // prettier 방지용 주석
      'sap/ui/model/json/JSONModel',
      'sap/ui/core/Fragment',
      'sap/m/MessageBox',
      '../../model/formatter',
      '../BaseController',
    ],
    (
      mobileLibrary, // prettier 방지용 주석
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
          }, 200);
        }

      setAppdt(vAppdt) {
        if(vAppdt) 
          return `${vAppdt.slice(0, 4)}.${vAppdt.slice(4, 6)}.${vAppdt.slice(6, 8)}, ${vAppdt.slice(9, 11)}:${vAppdt.slice(11, 13)}`;
  
        return "";
      }

        onObjectMatched(oEvent) { 
          const sDataKey = oEvent.getParameter("arguments").oDataKey;

          if(sDataKey !== "N") {
            this.getTargetData(this, sDataKey);
          }else {
            const oDetailModel= new JSONModel();

            oDetailModel.setData({
              Appernr: '50006', 
              Pernr: '50006',
              Ename: '조용필',
              ZappStatAl: '',
            })
            this.setViewModel(oDetailModel, 'FormData');
          }
        }
        
        // 상세조회
        getTargetData(oController, sDataKey) {
          const oModel = oController.getModel("benefit");

          oModel.read("/ConExpenseApplSet", {
            async: false,
            filters: [
							new sap.ui.model.Filter("Prcty", sap.ui.model.FilterOperator.EQ, "D"),
							new sap.ui.model.Filter("Actty", sap.ui.model.FilterOperator.EQ, "E"),
							new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, "50006"),
							new sap.ui.model.Filter("Appno", sap.ui.model.FilterOperator.EQ, sDataKey),
						],
            success: function (oData) {
              if (oData) {
                // Common.log(oData);
                const oDetailModel= new JSONModel();
                const oTargetData = oData.results[0];

                oDetailModel.setData(oTargetData);
                oController.setViewModel(oDetailModel, 'FormData');
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
          const oListModel = new JSONModel();
          const oDetailModel = this.getViewModel('FormData');

          oModel.read("/BenefitCodeListSet", {
            async: false,
            filters: [
							new sap.ui.model.Filter("Cdnum", sap.ui.model.FilterOperator.EQ, "BE0001"),
							new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, '1000'),
							new sap.ui.model.Filter("Datum", sap.ui.model.FilterOperator.EQ, new Date()),
						],
            success: function (oData) {
              if (oData) {
                oListModel.setProperty('/BenefitType', oData.results);
                oDetailModel.setProperty('/Concode', oData.results[0].Zcode);

                oController.setViewModel(oListModel);

                setTimeout(() => {
                  oController.onTypeChange();
                }, 200);
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
          const oListModel = this.getViewModel();
          const oDetailModel = this.getViewModel('FormData');
          const sSelectKey = oEvent ? oEvent.getSource().getSelectedKey() : oDetailModel.getProperty('/Concode');
          let sSelectText = "";

          if(!oEvent) {
            oListModel.getProperty("/BenefitType").forEach((e) => {
              if(sSelectKey === e.Zcode) sSelectText = e.Ztext;
            });
          }else
            sSelectText = oEvent.getSource().getSelectedItem().getText();

          oDetailModel.setProperty('/Context', sSelectText);

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
                oListModel.setProperty('/BenefitCause', oData.results);
                oListModel.setProperty("/BenefitRelation", []);

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
          const oListModel = this.getViewModel();
          const oDetailModel = this.getViewModel('FormData');
          const sSelectKey = oEvent ? oEvent.getSource().getSelectedKey() : oDetailModel.getProperty('/Conresn');
          let sSelectText = "";

          if(!oEvent) {
            oListModel.getProperty("/BenefitCause").forEach((e) => {
              if(sSelectKey === e.Zcode) sSelectText = e.Ztext;
            });
          }else
            sSelectText = oEvent.getSource().getSelectedItem().getText();

          oDetailModel.setProperty('/Conretx', sSelectText);

          if(oEvent) this.getNomalPay(this);

          oModel.read("/BenefitCodeListSet", {
            async: false,
            filters: [
							new sap.ui.model.Filter("Cdnum", sap.ui.model.FilterOperator.EQ, "BE0003"),
							new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, '1000'),
              new sap.ui.model.Filter("Datum", sap.ui.model.FilterOperator.EQ, new Date()),
							new sap.ui.model.Filter("Upcod", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/Concode')),
							new sap.ui.model.Filter("Upcod2", sap.ui.model.FilterOperator.EQ, sSelectKey),
						],
            success: function (oData) {
              if (oData) {
                oListModel.setProperty('/BenefitRelation', oData.results);
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
          const oDetailModel = this.getViewModel('FormData');
  
          oModel.read("/ConExpenseCheckListSet", {
            async: false,
            filters: [
              new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, '1000'),
              new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, "50006"),
              new sap.ui.model.Filter("Concode", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/Concode')),
              new sap.ui.model.Filter("Conresn", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/Conresn')),
              new sap.ui.model.Filter("Conddate", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/Conddate')),
            ],
            success: function (oData) {
              if (oData) {
                const oPay = oData.results[0];
                
                oDetailModel.setProperty('/ZbacBet', oPay.ZbacBet);
                oDetailModel.setProperty('/ZbacBetT', oPay.ZbacBetT);
                oDetailModel.setProperty('/Payrt', oPay.Payrt);
                oDetailModel.setProperty('/PayrtT', oPay.PayrtT);
                oDetailModel.setProperty('/ZpayBetT', oPay.ZpayBetT);
                oDetailModel.setProperty('/ZpayBet', oPay.ZpayBet);
                oDetailModel.setProperty('/Zflower', oPay.Zflower);
                oDetailModel.setProperty('/Zemp', oPay.Zemp);
              }
            },
            error: function (oRespnse) {
              // Common.log(oResponse);
            }
          });
        }

        // 대상자 성명 선택시
        onTargetDialog() {
          const oListModel = this.getViewModel();

          this.getTargetList(this);

          setTimeout(() => {
            if(oListModel.getProperty('/TargetList').length === 1) return;
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
          const oListModel = this.getViewModel();
          const oDetailModel = this.getViewModel('FormData');
  
          oModel.read("/ConExpenseSupportListSet", {
            async: true,
            filters: [
              new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, '1000'),
              new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, "50006"),
              new sap.ui.model.Filter("Concode", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/Concode')),
              new sap.ui.model.Filter("Conresn", sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/Conresn')),
              new sap.ui.model.Filter("Datum", sap.ui.model.FilterOperator.EQ, new Date()),
            ],
            success: function (oData) {
              if (oData) {
                const oTargetList = oData.results;
                
                oListModel.setProperty('/TargetList', oTargetList);

                if(oTargetList.length === 1) {
                  oDetailModel.setProperty("/Zbirthday", oTargetList[0].Zbirthday);
                  oDetailModel.setProperty("/Kdsvh", oTargetList[0].Kdsvh);
                  oDetailModel.setProperty("/Zname", oTargetList[0].Zname);
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
          const oDetailModel = this.getViewModel('FormData');
          const oRowData = oDetailModel.getProperty(vPath);

          oDetailModel.setProperty("/Zbirthday", oRowData.Zbirthday);
          oDetailModel.setProperty("/Kdsvh", oRowData.Kdsvh);
          oDetailModel.setProperty("/Zname", oRowData.Zname);
          this.byId('targetSettingsDialog').close();
        }

        //  대상자 성명 Dialog 닫기클릭
        onClick() {
          this.byId('targetSettingsDialog').close();
        }

        checkError(oController) {
          const oDetailModel = oController.getViewModel('FormData');
    
          // 대상자 생년월일
          if(!oDetailModel.getProperty('/Zbirthday')) {
            MessageBox.error("대상자 생년월일을 선택하세요.", { title: "안내"});
            return true;
          }
    
          // 증빙상 경조일
          if(!oDetailModel.getProperty('/Conddate')) {
            MessageBox.error("증빙상 경조일을 선택하세요.", { title: "안내"});
            return true;
          }
    
          // 실재 경조일
          if(!oDetailModel.getProperty('/Conrdate')) {
            MessageBox.error("실재 경조일을 선택하세요.", { title: "안내"});
            return true;
          }
    
          // 대상자 성명
          if(!oDetailModel.getProperty('/Zname')) {
            MessageBox.error("대상자 성명을 입력하세요.", { title: "안내"});
            return true;
          }
    
          // 행사장소
          if(!oDetailModel.getProperty('/Zeloc')) {
            MessageBox.error("행사장소를 입력하세요.", { title: "안내"});
            return true;
          }
    
          return false;
        }

        // 재작성
        onRewriteBtn() {
          this.getViewModel('FormData').setProperty('/ZappStatAl', '10');
        }

        // 임시저장
        onSaveBtn() {
          const oModel = this.getModel("benefit");
          const oDetailModel = this.getViewModel('FormData');
          const oController = this;

          if(this.checkError(this)) return;
          
          const onPressSave = function (fVal) {
            if (fVal && fVal === "저장") {
              let oSendObject = {};

              oSendObject = oDetailModel.getData();
              oSendObject.Prcty = 'T';
              oSendObject.Pernr = '50006';
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
          const oDetailModel = this.getViewModel('FormData');
          const oController = this;
          
          if(this.checkError(this)) return;

          const onPressApply = function (fVal) {
            if (fVal && fVal === "신청") {
              let oSendObject = {};
              const vStatus = oDetailModel.getProperty('/ZappStatAl');

              oSendObject = oDetailModel.getData();
              oSendObject.Prcty = 'C';
              oSendObject.Pernr = '50006';
              oSendObject.Actty = 'E';
              oSendObject.Appno = !vStatus || vStatus === '45' ? '' : oDetailModel.getProperty('/Appno');

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
          const oDetailModel = this.getViewModel('FormData');
          const oController = this;
          
          const onPressSave = function (fVal) {
            if (fVal && fVal === "확인") {
              let oSendObject = {};

              oSendObject = oDetailModel.getData();
              oSendObject.Prcty = 'W';
              oSendObject.Pernr = '50006';
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
          const oDetailModel = this.getViewModel('FormData');
          const oController = this;
          
          
          const onPressApply = function (fVal) {
            if (fVal && fVal == "삭제") {
              const sPath = oModel.createKey("/ConExpenseApplSet", {
                Appno: oDetailModel.getProperty('/Appno')
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
  