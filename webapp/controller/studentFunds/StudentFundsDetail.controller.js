/* eslint-disable no-useless-call */
sap.ui.define(
  [
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    '../../model/formatter',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/extension/moment',
  ],
  (JSONModel, MessageBox, formatter, EmpInfo, BaseController, AttachFileAction, ServiceNames) => {
    'use strict';

    class StudentFundsDetail extends BaseController {
      constructor() {
        super();
        this.formatter = formatter;
        this.AttachFileAction = AttachFileAction;
        this.TYPE_CODE = 'HR02';
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({
          FormData: {},
          Settings: {},
          busy: false,
          LimitAmountMSG: false,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
        EmpInfo.get.call(this);
        this.getRouter().getRoute('studentFunds-detail').attachPatternMatched(this.onObjectMatched, this);
      }

      onAfterShow() {
        new Promise((resolve) => {
          this.settingsAttachTable(this);
          this.getList(this);
          
          setTimeout(() => {
            resolve();
          }, 500);
        }).then(() => {
          this.getViewModel().setProperty('/busy', false);
          super.onAfterShow();
        });        
      }

      onNavBack() {
        window.history.go(-1);
      }

      onObjectMatched(oEvent) {
        const sDataKey = oEvent.getParameter('arguments').oDataKey;

        if (sDataKey !== 'N') {
          this.getTargetData.call(this, sDataKey);
        }else {
          const oDetailModel = this.getViewModel();

          oDetailModel.setProperty('/FormData', oDetailModel.getProperty('/TargetInfo'));
          oDetailModel.setProperty('/FormData/Apename', oDetailModel.getProperty('/TargetInfo/Ename'));
          oDetailModel.setProperty('/FormData/Appernr', oDetailModel.getProperty('/TargetInfo/Pernr'));

          oDetailModel.setProperty('/ApplyInfo', {
            Apename: oDetailModel.getProperty('/TargetInfo/Ename'),
            Orgtx: `${oDetailModel.getProperty('/TargetInfo/Btrtx')}/${oDetailModel.getProperty('/TargetInfo/Orgtx')}`,
            Apjikgbtl: `${oDetailModel.getProperty("/TargetInfo/Zzjikgbt")}/${oDetailModel.getProperty("/TargetInfo/Zzjiktlt")}`,
          });
        }
      }

      // 해외학교 체크시
      onCheckBox(oEvent) {
        const bSelected = oEvent.getSource().getSelected();

        if(bSelected) {
          this.getViewModel().setProperty("/FormData/Forsch", "X");
          this.getSupAmount(this);
        }else {
          this.getViewModel().setProperty("/FormData/Forsch", "");
          this.totalCost(this);
        }
      }

      // 학자금 총액에 들어가는 금액입력
      costCalculation(oEvent) {
        this.formatter.liveChangeCost.call(this, oEvent);

        setTimeout(() => {
          this.totalCost(this);
        }, 200);
      }


      // 장학금 입력시
      onSchoCost(oEvent) {
        this.formatter.liveChangeCost.call(this, oEvent);
      }

      // 지원금액 호출
      getSupAmount(oController) {
        const oModel = oController.getModel(ServiceNames.BENEFIT);
        const oDetailModel = oController.getViewModel();

        new Promise(resolve => {
          oModel.read('/BenefitCodeListSet', {
            async: false,
            filters: [
              new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0007'),
              new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
              new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/FormData/Slart')),
              new sap.ui.model.Filter('Upcod2', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/FormData/Zyear')),
            ],
            success: function (oData) {
              let oList = [];

              if (oData && !!oData.results.length) {
                oList = oData.results[0];
                oList.Zbetrg = oList.Zbetrg.replace('.', '');
              } 
              
              oDetailModel.setProperty("/LimitAmount", oList);
              resolve();
            },
            error: function (oRespnse) {
              console.log(oRespnse);
              const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;
  
              MessageBox.error(vErrorMSG);
            },
          });
        }).then(() => {
          oController.totalCost(oController); 
        });
      }

      // 학자금 총액
      totalCost(oController) {
        const oDetailModel = oController.getViewModel();
        const vCostA = parseInt(oDetailModel.getProperty("/FormData/ZbetEntr")) || 0;
        const vCostB = parseInt(oDetailModel.getProperty("/FormData/ZbetMgmt")) || 0;
        const vCostC = parseInt(oDetailModel.getProperty("/FormData/ZbetClass")) || 0;
        const vCostD = parseInt(oDetailModel.getProperty("/FormData/ZbetExer")) || 0;
        const vCostE = parseInt(oDetailModel.getProperty("/FormData/ZbetSuf")) || 0;
        const vCostF = parseInt(oDetailModel.getProperty("/FormData/ZbetEtc")) || 0;
        const bForschCheck = oController.byId('OverseasCheck').getSelected() || false;
        let vCostG = parseInt(oDetailModel.getProperty("/FormData/ZbetTotl")) || 0;

        vCostG = vCostA + vCostB + vCostC + vCostD + vCostE + vCostF;
        oDetailModel.setProperty("/FormData/ZbetTotl", String(vCostG));

        if(
          bForschCheck &&
          !!oDetailModel.getProperty("/LimitAmount") &&
          !!oDetailModel.getProperty("/LimitAmount/Zbetrg") &&
          vCostG > parseInt(oDetailModel.getProperty("/LimitAmount/Zbetrg")) &&
          (
            oDetailModel.getProperty("/FormData/Slart") === '05' ||
            oDetailModel.getProperty("/FormData/Slart") === '06'
          )
        ) {
          oDetailModel.setProperty("/FormData/ZpayAmt", oDetailModel.getProperty("/LimitAmount/Zbetrg"));
          oDetailModel.setProperty("/LimitAmountMSG", true);
        }else {
          oDetailModel.setProperty("/FormData/ZpayAmt", String(vCostG));
          oDetailModel.setProperty("/LimitAmountMSG", false);
        }
      }

      // 상세조회
      getTargetData(sDataKey) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        oModel.read('/SchExpenseApplSet', {
          async: false,
          filters: [
            new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'D'),
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

      // 화면관련 List호출
      getList(oController) {
        const oModel = oController.getModel(ServiceNames.BENEFIT);
        const oDetailModel = oController.getViewModel();
        const vStatus = oDetailModel.getProperty("/FormData/ZappStatAl");

        // 신청대상 조회
        oModel.read('/SchExpenseSupportListSet', {
          async: false,
          filters: [
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
          ],
          success: function (oData) {
            if (oData) {
              const oList = oData.results;

              oDetailModel.setProperty("/AppTarget", oList);

              const oMajorInput = oController.byId('MajorInput');
              // const vGradeCode = oDetailModel.getProperty("/FormData/Znametx");

              if(!vStatus) {
                oDetailModel.setProperty("/FormData/Znametx", oList[0].Znametx);
                oDetailModel.setProperty("/FormData/Kdsvh", oList[0].Kdsvh);
                oMajorInput.setEditable(false);
              }
            }
          },
          error: function (oRespnse) {
            console.log(oRespnse);
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });
        
        // 학력구분 조회
        oModel.read('/BenefitCodeListSet', {
          async: false,
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0006'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
          ],
          success: function (oData) {
            if (oData) {
              const oList = oData.results;

              oDetailModel.setProperty("/AcademicSort", oList);

              if(!vStatus) {
                oDetailModel.setProperty("/FormData/Slart", oList[0].Zcode);
              }
              
              const sCode = !vStatus ? oList[0].Zcode : oDetailModel.getProperty("/FormData/Slart");

              setTimeout(() => {
                oController.onShcoolList.call(oController, sCode);
              }, 150);
            }
          },
          error: function (oRespnse) {
            console.log(oRespnse);
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });

        // 학년 조회
        oModel.read('/BenefitCodeListSet', {
          async: true,
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0004'),
            new sap.ui.model.Filter('Grcod', sap.ui.model.FilterOperator.EQ, 'BE000002'),
            new sap.ui.model.Filter('Sbcod', sap.ui.model.FilterOperator.EQ, 'GRADE'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
          ],
          success: function (oData) {
            if (oData) {
              const oList = oData.results;

              oDetailModel.setProperty("/GradeList", oList);

              if(!vStatus) {
                oDetailModel.setProperty("/FormData/Grdsp", oList[0].Zcode);
              }
            }
          },
          error: function (oRespnse) {
            console.log(oRespnse);
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });

        // 학자금 발생년도 셋팅
        const iFullYears = new Date().getFullYear();
        const aYearsList = [];
        
        aYearsList.push(
          {Zcode: String(iFullYears), Ztext: `${iFullYears}년`},
          {Zcode: String(iFullYears - 1), Ztext: `${iFullYears - 1}년`}
        );

        oDetailModel.setProperty("/FundsYears", aYearsList);
        
        if(!vStatus) {
          oDetailModel.setProperty("/FormData/Zyear", aYearsList[0].Zcode);
          this.getSupAmount(this);
        }
      }

      // 신청대상 선택시
      onTargetChange(oEvent) {
        this.getApplyNumber(this);
      }

      // 지원횟수 조회
      getApplyNumber(oController) {
        const oModel = oController.getModel(ServiceNames.BENEFIT);
        const oDetailModel = oController.getViewModel();

        oDetailModel.getProperty("/AppTarget").forEach(e => {
          if(e.Kdsvh === oDetailModel.getProperty("/FormData/Kdsvh")) {
            oDetailModel.setProperty("/FormData/Zzobjps", e.Zzobjps);
            oDetailModel.setProperty("/FormData/Zname", e.Zname);
          }
        });

        oModel.read('/SchExpenseCntSet', {
          async: true,
          filters: [
            new sap.ui.model.Filter('Zname', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty("/FormData/Zname")),
            new sap.ui.model.Filter('Slart', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty("/FormData/Slart")),
            new sap.ui.model.Filter('Zzobjps', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty("/FormData/Zzobjps")),
          ],
          success: function (oData) {
            if (oData) {
              oDetailModel.setProperty("/FormData/Cnttx", oData.results[0].Cnttx);
            }
          },
          error: function (oRespnse) {
            console.log(oRespnse);
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });
      }

      // 학자금 발생년도 클릭
      onYearsSelect(oEvent) {
        this.getApplyNumber(this);
        this.getSupAmount(this);
      }

      // 학력구분 선택시
      onShcoolList(oEvent) {
        const oMajorInput = this.byId('MajorInput');
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const bSelectType = typeof(oEvent) === 'string';
        const vSelected = bSelectType ? oEvent : oEvent.getSource().getSelectedKey();
        const vStatus = oDetailModel.getProperty("/FormData/ZappStatAl");

        if(!vStatus || vStatus === '10') {
          if(vSelected === '05' || vSelected === '06') {
            oMajorInput.setEditable(true);
          }else {
            oMajorInput.setEditable(false);
          }
  
          if(!bSelectType) {
            oDetailModel.setProperty('/FormData/Schtx', '');
            oDetailModel.setProperty('/FormData/Majnm', '');
          }
        }
        
        this.getApplyNumber(this);
        this.getSupAmount(this);

        oModel.read('/BenefitCodeListSet', {
          async: true,
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0005'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, vSelected),
          ],
          success: function (oData) {
            if (oData) {
              const oList = oData.results;

              oDetailModel.setProperty("/QuarterList", oList);

              if(!vStatus) {
                oDetailModel.setProperty("/FormData/Divcd", oList[0].Zcode);
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

      checkError(oController, AppBtn) {
        const oDetailModel = oController.getViewModel();

       // 학교명
       if(!oDetailModel.getProperty('/FormData/Schtx')) {
          MessageBox.alert("학교명을 입력하세요.");
          return true;
        }

        // 수업료
        if(!oDetailModel.getProperty('/FormData/ZbetClass')) {
          MessageBox.alert("수업료를 입력하세요.");
          return true;
        }

        // 첨부파일
        if(!AttachFileAction.getFileLength.call(oController) && AppBtn === 'O') {
          MessageBox.alert("신청시 첨부파일은 필수입니다. 업로드 후 신청하시기 바랍니다.");
          return true;
        }

        return false;
      }

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

            MessageBox.alert(vErrorMSG);
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
          Cnttx: oDatas.Cnttx,
          Divcd: oDatas.Divcd,
          Forsch: oDatas.Forsch,
          Grdsp: oDatas.Grdsp,
          Majnm: oDatas.Majnm,
          Schtx: oDatas.Schtx,
          Slart: oDatas.Slart,
          Kdsvh: oDatas.Kdsvh,
          ZbetClass: oDatas.ZbetClass,
          ZbetEntr: oDatas.ZbetEntr,
          ZbetEtc: oDatas.ZbetEtc,
          ZbetExer: oDatas.ZbetExer,
          ZbetMgmt: oDatas.ZbetMgmt,
          ZbetShip: oDatas.ZbetShip,
          ZbetSuf: oDatas.ZbetSuf,
          ZbetTotl: oDatas.ZbetTotl,
          Znametx: oDatas.Znametx,
          Zname: oDatas.Zname,
          ZpayAmt: oDatas.ZpayAmt,
          Zyear: oDatas.Zyear,
          Zzjikcht: oDatas.Zzjikcht,
          Zzjikgbt: oDatas.Zzjikgbt,
          Zzjiktlt: oDatas.Zzjiktlt,
          Zzobjps: oDatas.Zzobjps,
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

              oModel.create('/SchExpenseApplSet', oSendObject, {
                success: function () {
                  // FileUpload
                  AttachFileAction.uploadFile.call(oController, oDetailModel.getProperty('/FormData/Appno'), oController.TYPE_CODE);

                  MessageBox.alert('저장되었습니다.', {
                    onClose: function () {
                      oController.getRouter().navTo('studentFunds');
                    },
                  });
                },
                error: function (oRespnse) {
                  console.log(oRespnse);
                  const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                  MessageBox.alert(vErrorMSG);
                },
              });
            }, 500);
          }
        };

        MessageBox.confirm('저장 하시겠습니까?', {
          title: '학자금 신청',
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

        if (this.checkError(this, 'O')) return;

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

              oModel.create('/SchExpenseApplSet', oSendObject, {
                success: function () {
                  // FileUpload
                  AttachFileAction.uploadFile.call(oController, oDetailModel.getProperty('/FormData/Appno'), oController.TYPE_CODE);

                  MessageBox.alert('신청되었습니다.', {
                    onClose: function () {
                      oController.getRouter().navTo('studentFunds');
                    },
                  });
                },
                error: function (oRespnse) {
                  console.log(oRespnse);
                  const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                  MessageBox.alert(vErrorMSG);
                },
              });
            }, 500);
          }
        };

        MessageBox.confirm('신청 하시겠습니까?', {
          title: '학자금 신청',
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

            oModel.create('/SchExpenseApplSet', oSendObject, {
              async: false,
              success: function () {
                MessageBox.alert('신청이 취소되었습니다.', {
                  onClose: function () {
                    oController.getRouter().navTo('studentFunds');
                  },
                });
              },
              error: function (oRespnse) {
                console.log(oRespnse);
                const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                MessageBox.alert(vErrorMSG);
              },
            });
          }
        };

        MessageBox.confirm('취소 하시겠습니까?', {
          title: '학자금 신청',
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
            const sPath = oModel.createKey('/SchExpenseApplSet', {
              Appno: oDetailModel.getProperty('/FormData/Appno'),
            });

            oModel.remove(sPath, {
              async: false,
              success: function () {
                MessageBox.alert('삭제되었습니다.', {
                  onClose: function () {
                    oController.getRouter().navTo('studentFunds');
                  },
                });
              },
              error: function (oRespnse) {
                console.log(oRespnse);
                const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

                MessageBox.alert(vErrorMSG);
              },
            });
          }
        };

        MessageBox.confirm('삭제 하시겠습니까?', {
          title: '학자금 신청',
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
          Message: "증빙자료를 꼭 등록하세요.",
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      }
    }

    return StudentFundsDetail;
  }
);
