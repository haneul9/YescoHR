/* eslint-disable no-useless-call */
sap.ui.define(
  [
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    '../../model/formatter',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/extension/moment',
  ],
  (JSONModel, Fragment, MessageBox, formatter, EmpInfo, BaseController, AttachFileAction, ServiceNames) => {
    'use strict';

    class CongDetail extends BaseController {
      constructor() {
        super();
        this.formatter = formatter;
        this.AttachFileAction = AttachFileAction;
        this.TYPE_CODE = 'HR01';
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({
          FormData: {},
          Settings: {},
          busy: false,
          bInitStatus: true,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
        EmpInfo.get.call(this);
        this.getRouter().getRoute('congratulation-detail').attachPatternMatched(this.onObjectMatched, this);
      }

      onAfterShow() {
        new Promise((resolve) => {
          this.settingsAttachTable(this);
          this.getBenefitType(this);
          
          setTimeout(() => {
            resolve();
          }, 500);
        }).then(() => {
          this.getViewModel().setProperty('/busy', false);
          this.getViewModel().setProperty("/bInitStatus", false);
        });

        super.onAfterShow();
      }

      onNavBack() {
        window.history.go(-1);
      }

      onObjectMatched(oEvent) {
        const sDataKey = oEvent.getParameter('arguments').oDataKey;

        if (sDataKey !== 'N') {
          this.getTargetData.call(this, sDataKey);
        }
      }

      formatFlowerTxt(vFlower) {
        return vFlower === undefined ? '' : vFlower === 'X' ? 'Y' : 'N';
      }

      // 상세조회
      getTargetData(sDataKey) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        oModel.read('/ConExpenseApplSet', {
          async: false,
          filters: [
            new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'D'),
            new sap.ui.model.Filter('Actty', sap.ui.model.FilterOperator.EQ, 'E'),
            new sap.ui.model.Filter('Appno', sap.ui.model.FilterOperator.EQ, sDataKey),
          ],
          success: function (oData) {
            if (oData) {
              // Common.log(oData);
              const oTargetData = oData.results[0];

              oDetailModel.setProperty('/FormData', oTargetData);
              oDetailModel.setProperty('/ApplyInfo', oTargetData);
              oDetailModel.setProperty('/ApprovalDetails', oTargetData);
            }
          },
          error: function (oRespnse) {
            // Common.log(oResponse);
          },
        });
      }

      // 경조유형
      getBenefitType(oController) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        oModel.read('/BenefitCodeListSet', {
          async: false,
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0001'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
          ],
          success: function (oData) {
            if (oData) {
              const oList = oData.results;
              oDetailModel.setProperty('/BenefitType', oList);

              if (oDetailModel.getProperty('/FormData') !== null && typeof oDetailModel.getProperty('/FormData') === 'object' && !Object.keys(oDetailModel.getProperty('/FormData')).length) {
                oDetailModel.setProperty('/FormData', oDetailModel.getProperty('/TargetInfo'));
                oDetailModel.setProperty('/FormData/Apename', oDetailModel.getProperty('/TargetInfo/Ename'));
                oDetailModel.setProperty('/FormData/Appernr', oDetailModel.getProperty('/TargetInfo/Pernr'));

                oDetailModel.setProperty('/ApplyInfo', {
                  Apename: oDetailModel.getProperty('/TargetInfo/Ename'),
                  Orgtx: `${oDetailModel.getProperty('/TargetInfo/Btrtx')}/${oDetailModel.getProperty('/TargetInfo/Orgtx')}`,
                  Apjikgbtl: `${oDetailModel.getProperty("/TargetInfo/Zzjikgbt")}/${oDetailModel.getProperty("/TargetInfo/Zzjiktlt")}`,
                });
              }

              setTimeout(() => {
                oController.onTypeChange();
              }, 0);
            }
          },
          error: function (oRespnse) {
            console.log(oRespnse);
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });
      }

      // 경조유형 선택시
      onTypeChange(oEvent) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oController = this;
        const oDetailModel = this.getViewModel();
        const sSelectKey = oEvent ? oEvent.getSource().getSelectedKey() : oDetailModel.getProperty('/FormData/Concode');
        let sSelectText = '';

        if (!oEvent) {
          oDetailModel.getProperty('/BenefitType').forEach((e) => {
            if (sSelectKey === e.Zcode) sSelectText = e.Ztext;
          });
        } else sSelectText = oEvent.getSource().getSelectedItem().getText();

        oDetailModel.setProperty('/FormData/Context', sSelectText);

        oModel.read('/BenefitCodeListSet', {
          async: false,
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0002'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, sSelectKey),
            new sap.ui.model.Filter('Upcod2', sap.ui.model.FilterOperator.EQ, 'E'),
          ],
          success: function (oData) {
            if (oData) {
              oDetailModel.setProperty('/BenefitCause', oData.results);
              oDetailModel.setProperty('/BenefitRelation', []);

              setTimeout(() => {
                oController.onCauseChange();
              }, 0);
            }
          },
          error: function (oRespnse) {
            console.log(oRespnse);
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });
      }

      // 경조사유 선택시
      onCauseChange(oEvent) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oController = this;
        const sSelectKey = oEvent ? oEvent.getSource().getSelectedKey() : oDetailModel.getProperty('/FormData/Conresn');
        let sSelectText = '';

        if (!oEvent) {
          oDetailModel.getProperty('/BenefitCause').forEach((e) => {
            if (sSelectKey === e.Zcode) sSelectText = e.Ztext;
          });
        } else sSelectText = oEvent.getSource().getSelectedItem().getText();

        oDetailModel.setProperty('/FormData/Conretx', sSelectText);

        if (oEvent) this.getNomalPay(this);

        oModel.read('/BenefitCodeListSet', {
          async: false,
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0003'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/FormData/Concode')),
            new sap.ui.model.Filter('Upcod2', sap.ui.model.FilterOperator.EQ, sSelectKey),
          ],
          success: function (oData) {
            if (oData) {
              const oResult = oData.results;
              const oRelationBtn = oController.byId('RelationBtn');
              const oRelationTxt = oController.byId('RelationTxt');
              const oBirthDatePicker = oController.byId('BirthDatePicker');

              oDetailModel.setProperty('/BenefitRelation', oResult);
              oDetailModel.setProperty("/TargetList", []);

              if(!oDetailModel.getProperty("/FormData/ZappStatAl") || oDetailModel.getProperty("/FormData/ZappStatAl") === '10') {
                if (!!oResult[0] && oResult[0].Zcode === 'ME') {
                  oController.onTargetDialog.call(oController);
                  oRelationBtn.setVisible(false);
                  oRelationTxt.setEditable(false);
                  oBirthDatePicker.setEditable(false);
                } else {
                  const bInitStatus = oDetailModel.getProperty("/bInitStatus");
                  
                  if(!bInitStatus) {
                    oDetailModel.setProperty('/FormData/Zbirthday', null);
                    oDetailModel.setProperty('/FormData/Kdsvh', oResult[0].Zcode);
                    oDetailModel.setProperty('/FormData/Zname', '');
                  }
                  oRelationBtn.setVisible(true);
                  oRelationTxt.setEditable(true);
                  oBirthDatePicker.setEditable(true);
                }
              }
            }
          },
          error: function (oRespnse) {
            console.log(oRespnse);
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });
      }

      // 대상자 관계선택시
      onRelationChange(oEvent) {
        const oDetailModel = this.getViewModel();
        const sSelectKey = oEvent.getSource().getSelectedKey();
        const oRelationBtn = this.byId('RelationBtn');
        const oRelationTxt = this.byId('RelationTxt');
        const oBirthDatePicker = this.byId('BirthDatePicker');

        oDetailModel.setProperty('/FormData/Kdsvh', sSelectKey);

        if (!!sSelectKey && sSelectKey === 'ME') {
          this.onTargetDialog.call(this);
          oRelationBtn.setVisible(false);
          oRelationTxt.setEditable(false);
          oBirthDatePicker.setEditable(false);
        } else {          
          oDetailModel.setProperty('/FormData/Zbirthday', null);
          oDetailModel.setProperty('/FormData/Zname', '');
          oRelationBtn.setVisible(true);
          oRelationTxt.setEditable(true);
          oBirthDatePicker.setEditable(true);
        }
      }

      // 증빙상 경조일 선택시
      onBenefitChangeDate(oEvent) {
        this.getViewModel().setProperty('/FormData/Conrdate', oEvent.getSource().getDateValue());
        this.getNomalPay(this);
      }

      // 기본급, 지급율 등 받아옴
      getNomalPay() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const vConcode = oDetailModel.getProperty('/FormData/Concode');
        const vConresn = oDetailModel.getProperty('/FormData/Conresn');
        const vConddate = oDetailModel.getProperty('/FormData/Conddate');

        if (!vConcode || !vConresn || !vConddate) return;

        oModel.read('/ConExpenseCheckListSet', {
          async: false,
          filters: [
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Concode', sap.ui.model.FilterOperator.EQ, vConcode),
            new sap.ui.model.Filter('Conresn', sap.ui.model.FilterOperator.EQ, vConresn),
            new sap.ui.model.Filter('Conddate', sap.ui.model.FilterOperator.EQ, vConddate),
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
            console.log(oRespnse);
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });
      }

      // 대상자 성명 선택시
      onTargetDialog() {
        const oDetailModel = this.getViewModel();

        // load asynchronous XML fragment
        if (!this.byId('targetSettingsDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.view.congratulation.TargetDialog',
            controller: this,
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            this.getTargetList(this);

            setTimeout(() => {
              if (oDetailModel.getProperty('/TargetList').length === 1 || oDetailModel.getProperty("/FormData/Kdsvh") === 'ME') return;

              if(oDetailModel.getProperty('/TargetList').length === 0) {
                return MessageBox.alert("해당하는 대상자 정보가 없습니다. \n 가족정보를 추가하시거나, 성명을 직접 입력하시기 바랍니다.");
              }

              oDialog.open();
            }, 500);
          });
        } else {
          this.getTargetList(this);

          setTimeout(() => {
            if (oDetailModel.getProperty('/TargetList').length === 1 || oDetailModel.getProperty("/FormData/Kdsvh") === 'ME') return;

            if(oDetailModel.getProperty('/TargetList').length === 0) {
              return MessageBox.alert("해당하는 대상자 정보가 없습니다. \n 가족정보를 추가하시거나, 성명을 직접 입력하시기 바랍니다.");
            }
            
            this.byId('targetSettingsDialog').open();
          }, 500);
        }
      }

      // 대상자 리스트 조회
      getTargetList(oController) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        oModel.read('/ConExpenseSupportListSet', {
          async: false,
          filters: [
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Concode', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/FormData/Concode')),
            new sap.ui.model.Filter('Conresn', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/FormData/Conresn')),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
          ],
          success: function (oData) {
            if (oData) {
              const oTargetList = oData.results;
              const oChildList = [];

              oTargetList.forEach(e => {
                if(oTargetList.length !== 0 && oDetailModel.getProperty("/FormData/Kdsvh") === e.Kdsvh) {
                  oChildList.push(e);
                }
              });

              if (oTargetList.length === 1) {
                oDetailModel.setProperty('/FormData/Zbirthday', oTargetList[0].Zbirthday);
                oDetailModel.setProperty('/FormData/Kdsvh', oTargetList[0].Kdsvh);
                oDetailModel.setProperty('/FormData/Zname', oTargetList[0].Zname);
              }

              oDetailModel.setProperty('/TargetList', oChildList);
              oController.byId('targetTable').setVisibleRowCount(oChildList.length);
            }
          },
          error: function (oRespnse) {
            console.log(oRespnse);
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });
      }

      // Dialog 대상자 클릭
      TargetClick(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oDetailModel = this.getViewModel();
        const oRowData = oDetailModel.getProperty(vPath);

        oDetailModel.setProperty('/FormData/Zbirthday', oRowData.Zbirthday);
        oDetailModel.setProperty('/FormData/Kdsvh', oRowData.Kdsvh);
        oDetailModel.setProperty('/FormData/Zname', oRowData.Zname);
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
          MessageBox.alert("대상자 생년월일을 선택하세요.");
          return true;
        }

        // 경조일
        if(!oDetailModel.getProperty('/FormData/Conddate')) {
          MessageBox.alert("경조일을 선택하세요.");
          return true;
        }    

        // 대상자 성명
        if(!oDetailModel.getProperty('/FormData/Zname')) {
          MessageBox.alert("대상자 성명을 입력하세요.");
          return true;
        }

        // 행사장소
        if(!oDetailModel.getProperty('/FormData/Zeloc')) {
          MessageBox.alert("행사장소를 입력하세요.");
          return true;
        }

        return false;
      }

      // getBinaryFile() {
      //   const oDetailModel = this.getViewModel();
      //   const aFileData = oDetailModel.getProperty("/Data");
      //   const oBinaryFiles = [];

      //   if(!aFileData) return;

      //   oDetailModel.setProperty("/BinaryFile", []);

      //   aFileData.forEach(elem => {
      //     const oFileReader = new FileReader();

      //     oFileReader.onload = e => {
      //       console.log(e.target.result);

      //       oBinaryFiles.push({Binary: window.btoa(e.target.result)});
      //     }

      //     oFileReader.onloadend = () => {
      //       oDetailModel.setProperty("/BinaryFile", oBinaryFiles);
      //     }

      //     oFileReader.readAsBinaryString(elem);
      //   });
      // }

      // Appno
      getAppno(oController) {
        const oModel = oController.getModel(ServiceNames.COMMON);
        const oDetailModel = oController.getViewModel();

        oModel.read('/CreateAppnoSet', {
          async: false,
          success: function (oData) {
            if (oData) {
              // Common.log(oData);
              oDetailModel.setProperty('/FormData/Appno', oData.results[0].Appno);
            }
          },
          error: function (oRespnse) {
            console.log(oRespnse);
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });
      }

      // 재작성
      onRewriteBtn() {
        this.getViewModel().setProperty('/FormData/ZappStatAl', '10');
      }

      // oData호출 mapping
      sendDataFormat(oDatas) {
        let oSendObject = {
          Appdt: oDatas.Appdt,
          Appno: oDatas.Appno,
          Apename: oDatas.Apename,
          Appernr: oDatas.Appernr,
          Concode: oDatas.Concode,
          Conddate: moment(oDatas.Conddate).hours(10).toDate(),
          Conrdate: moment(oDatas.Conrdate).hours(10).toDate(),
          Conresn: oDatas.Conresn,
          Conretx: oDatas.Conretx,
          Context: oDatas.Context,
          Ename: oDatas.Ename,
          Kdsvh: oDatas.Kdsvh,
          Orgtx: oDatas.Orgtx,
          Payrt: oDatas.Payrt,
          PayrtT: oDatas.PayrtT,
          Pernr: oDatas.Pernr,
          ZbacBet: oDatas.ZbacBet,
          ZbacBetT: oDatas.ZbacBetT,
          Zbirthday: moment(oDatas.Zbirthday).hours(10).toDate(),
          Zeloc: oDatas.Zeloc,
          Zemp: oDatas.Zemp,
          Zflower: oDatas.Zflower,
          Zname: oDatas.Zname,
          ZpayBet: oDatas.ZpayBet,
          ZpayBetT: oDatas.ZpayBetT,
          Zzjikcht: oDatas.Zzjikcht,
          Zzjikgbt: oDatas.Zzjikgbt,
          Zzjiktlt: oDatas.Zzjiktlt,
        };

        return oSendObject;
      }

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oController = this;
        const vStatus = oDetailModel.getProperty('/FormData/ZappStatAl');

        if (this.checkError(this)) return;

        const onPressSave = function (fVal) {
          if (fVal && fVal === '저장') {
            if (!vStatus || vStatus === '45') {
              oController.getAppno(oController);
              oDetailModel.setProperty("/FormData/Appdt", new Date());
            }

            setTimeout(() => {
              let oSendObject = {};
              const oSendData = oController.sendDataFormat(oDetailModel.getProperty('/FormData'));

              oSendObject = oSendData;
              oSendObject.Prcty = 'T';
              oSendObject.Actty = 'E';
              oSendObject.Waers = 'KRW';

              oModel.create('/ConExpenseApplSet', oSendObject, {
                success: function (oData) {
                  // FileUpload
                  AttachFileAction.uploadFile.call(oController, oDetailModel.getProperty('/FormData/Appno'), 'HR01');

                  MessageBox.alert('저장되었습니다.', {
                    onClose: function () {
                      oController.getRouter().navTo('congratulation');
                    },
                  });
                  // oController.getRouter().navTo("congratulation");
                },
                error: function (oRespnse) {
                  console.log(oRespnse);
                  const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                  MessageBox.error(vErrorMSG);
                },
              });
            }, 500);
          }
        };

        MessageBox.confirm('저장 하시겠습니까?', {
          title: '경조금 신청',
          actions: ['저장', '취소'],
          onClose: onPressSave,
        });
      }

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oController = this;
        const vStatus = oDetailModel.getProperty('/FormData/ZappStatAl');

        if (this.checkError(this)) return;

        const onPressApply = function (fVal) {
          if (fVal && fVal === '신청') {
            if (!vStatus || vStatus === '45') {
              oController.getAppno(oController);
              oDetailModel.setProperty("/FormData/Appdt", new Date());
            }

            setTimeout(() => {
              let oSendObject = {};
              const oSendData = oController.sendDataFormat(oDetailModel.getProperty('/FormData'));

              oSendObject = oSendData;
              oSendObject.Prcty = 'C';
              oSendObject.Actty = 'E';
              oSendObject.Waers = 'KRW';

              oModel.create('/ConExpenseApplSet', oSendObject, {
                success: function (oData) {
                  // FileUpload
                  AttachFileAction.uploadFile.call(oController, oDetailModel.getProperty('/FormData/Appno'), 'HR01');

                  MessageBox.alert('신청되었습니다.', {
                    onClose: function () {
                      oController.getRouter().navTo('congratulation');
                    },
                  });
                },
                error: function (oRespnse) {
                  console.log(oRespnse);
                  const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                  MessageBox.error(vErrorMSG);
                },
              });
            }, 500);
          }
        };

        MessageBox.confirm('신청 하시겠습니까?', {
          title: '경조금 신청',
          actions: ['신청', '취소'],
          onClose: onPressApply,
        });
      }

      // 취소
      onCancelBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oController = this;

        const onPressSave = function (fVal) {
          if (fVal && fVal === '확인') {
            let oSendObject = {};

            oSendObject = oDetailModel.getProperty('/FormData');
            oSendObject.Prcty = 'W';
            oSendObject.Actty = 'E';

            oModel.create('/ConExpenseApplSet', oSendObject, {
              async: false,
              success: function () {
                MessageBox.alert('신청이 취소되었습니다.', {
                  onClose: function () {
                    oController.getRouter().navTo('congratulation');
                  },
                });
              },
              error: function (oRespnse) {
                console.log(oRespnse);
                const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                MessageBox.error(vErrorMSG);
              },
            });
          }
        };

        MessageBox.confirm('취소 하시겠습니까?', {
          title: '경조금 신청',
          actions: ['확인', '취소'],
          onClose: onPressSave,
        });
      }

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oController = this;

        const onPressApply = function (fVal) {
          if (fVal && fVal == '삭제') {
            const sPath = oModel.createKey('/ConExpenseApplSet', {
              Appno: oDetailModel.getProperty('/FormData/Appno'),
            });

            oModel.remove(sPath, {
              async: false,
              success: function () {
                MessageBox.alert('삭제되었습니다.', {
                  onClose: function (oEvent) {
                    oController.getRouter().navTo('congratulation');
                  },
                });
              },
              error: function (oRespnse) {
                console.log(oRespnse);
                const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                MessageBox.error(vErrorMSG);
              },
            });
          }
        };

        MessageBox.confirm('삭제 하시겠습니까?', {
          title: '경조금 신청',
          actions: ['삭제', '취소'],
          onClose: onPressApply,
        });
      }

      // AttachFileTable Settings
      settingsAttachTable(oController) {
        const oDetailModel = oController.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(oController, {
          Editable: !sStatus || sStatus === '10',
          Type: oController.TYPE_CODE,
          Appno: sAppno,
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
        // oDetailModel.setProperty("/Settings/Editable", !sStatus || sStatus === '10');
        // oDetailModel.setProperty("/Settings/Gubun", false);

        // AttachFileAction.refreshAttachFileList.call(this, sAppno, 'HR01');
      }
    }

    return CongDetail;
  }
);
