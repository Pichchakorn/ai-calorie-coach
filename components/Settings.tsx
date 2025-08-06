import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio_group";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuth } from "../contexts/AuthContext";
import { UserProfile } from "../types";
import {
  formatCalories,
  formatWeight,
  getGoalText,
  getActivityText,
  validateGoal,
} from "../utils/calculations";
import {
  Settings as SettingsIcon,
  User,
  Target,
  Activity,
  Save,
  Trash2,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner@2.0.3";

export function Settings() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [profile, setProfile] = useState<Partial<UserProfile>>(
    user?.profile || {
      gender: "male",
      activityLevel: "moderate",
      goal: "maintain",
    },
  );

  const [goalValidation, setGoalValidation] = useState<{
    isValid: boolean;
    message?: string;
  }>({ isValid: true });

  // ตรวจสอบความถูกต้องของเป้าหมายเมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    if (
      profile.weight &&
      profile.targetWeight &&
      profile.timeframe &&
      profile.goal !== "maintain"
    ) {
      const validation = validateGoal(profile as UserProfile);
      setGoalValidation(validation);
    } else {
      setGoalValidation({ isValid: true });
    }
  }, [
    profile.weight,
    profile.targetWeight,
    profile.timeframe,
    profile.goal,
  ]);

  const handleSaveUserInfo = () => {
    if (!userInfo.name.trim()) {
      toast.error("กรุณากรอกชื่อ");
      return;
    }

    updateUser({
      name: userInfo.name,
      email: userInfo.email,
    });
    setIsEditing(false);
  };

  const handleSaveProfile = () => {
    if (!profile.age || !profile.weight || !profile.height) {
      toast.error("กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วน");
      return;
    }

    if (!goalValidation.isValid) {
      toast.error("กรุณาตรวจสอบเป้าหมายของคุณ");
      return;
    }

    updateUser({
      profile: profile as UserProfile,
    });
  };

  const handleGoalChange = (goal: UserProfile["goal"]) => {
    setProfile((prev) => ({
      ...prev,
      goal,
      // รีเซ็ตเป้าหมายเมื่อเปลี่ยนประเภท
      targetWeight:
        goal === "maintain" ? undefined : prev.targetWeight,
      timeframe:
        goal === "maintain" ? undefined : prev.timeframe,
    }));
  };

  const handleDeleteAccount = () => {
    // In a real app, this would show a confirmation dialog
    const confirmed = window.confirm(
      "คุณแน่ใจหรือไม่ที่จะลบบัญชี? การกระทำนี้ไม่สามารถยกเลิกได้",
    );
    if (confirmed) {
      // In real app, would call API to delete account
      toast.success("ลบบัญชีสำเร็จ (Demo)");
    }
  };

  const isProfileValid =
    profile.age &&
    profile.weight &&
    profile.height &&
    profile.gender &&
    profile.activityLevel &&
    profile.goal &&
    goalValidation.isValid;

  // คำนวณข้อมูลสำหรับแสดงผล
  const getGoalPreview = () => {
    if (
      !profile.weight ||
      !profile.targetWeight ||
      !profile.timeframe ||
      profile.goal === "maintain"
    ) {
      return null;
    }

    const weightDifference = Math.abs(
      profile.weight - profile.targetWeight,
    );
    const weeklyChange = weightDifference / profile.timeframe;

    return {
      weightDifference,
      weeklyChange,
      timeframe: profile.timeframe,
    };
  };

  const goalPreview = getGoalPreview();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="mb-2 flex items-center justify-center gap-3">
          <SettingsIcon className="h-8 w-8 text-ocean" />
          <span
            style={{
              background:
                "linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.75 0.18 330))",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            ตั้งค่าบัญชี
          </span>
        </h1>
        <p className="text-muted-foreground">
          จัดการข้อมูลส่วนตัวและตั้งค่าต่าง ๆ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ข้อมูลผู้ใช้ */}
        <Card
          style={{
            boxShadow:
              "0 4px 14px 0 oklch(0.6 0.2 230 / 0.2), 0 0 0 1px oklch(0.6 0.2 230 / 0.1)",
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-ocean" />
              <span className="text-ocean">ข้อมูลผู้ใช้</span>
            </CardTitle>
            <CardDescription>
              ข้อมูลพื้นฐานของบัญชีของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-deep-blue font-medium"
                  >
                    ชื่อ-นามสกุล
                  </Label>
                  <Input
                    id="name"
                    value={userInfo.name}
                    onChange={(e) =>
                      setUserInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="ชื่อ นามสกุล"
                    className="border-ocean/30 focus:border-ocean focus:ring-ocean/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-deep-blue font-medium"
                  >
                    อีเมล
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) =>
                      setUserInfo((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="your@email.com"
                    className="bg-muted border-muted"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    อีเมลไม่สามารถเปลี่ยนแปลงได้
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveUserInfo}
                    size="sm"
                    className="text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.6 0.2 230), oklch(0.65 0.18 210))",
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    บันทึก
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-sunset text-sunset hover:bg-sunset/10"
                    onClick={() => {
                      setIsEditing(false);
                      setUserInfo({
                        name: user?.name || "",
                        email: user?.email || "",
                      });
                    }}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-deep-blue font-medium">
                    ชื่อ-นามสกุล
                  </Label>
                  <p className="text-lg text-ocean">
                    {user?.name}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-deep-blue font-medium">
                    อีเมล
                  </Label>
                  <p className="text-lg text-sunset">
                    {user?.email}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-deep-blue font-medium">
                    สมาชิกตั้งแต่
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {user?.createdAt &&
                      new Date(
                        user.createdAt,
                      ).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="border-lavender text-lavender hover:bg-lavender/10"
                >
                  แก้ไขข้อมูล
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* โปรไฟล์สุขภาพ */}
        <Card
          style={{
            boxShadow:
              "0 4px 14px 0 oklch(0.75 0.18 330 / 0.2), 0 0 0 1px oklch(0.75 0.18 330 / 0.1)",
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-sunset" />
              <span className="text-sunset">โปรไฟล์สุขภาพ</span>
            </CardTitle>
            <CardDescription>
              ข้อมูลสำหรับคำนวณแคลอรี่และแผนอาหาร
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* เพศ */}
            <div className="space-y-3">
              <Label className="text-deep-blue font-medium">
                เพศ
              </Label>
              <RadioGroup
                value={profile.gender}
                onValueChange={(value: "male" | "female") =>
                  setProfile((prev) => ({
                    ...prev,
                    gender: value,
                  }))
                }
                className="flex gap-6"
              >
                <div
                  className="flex items-center space-x-2 p-3 rounded-lg border border-ocean/20 hover:bg-ocean/5"
                  style={{
                    background:
                      profile.gender === "male"
                        ? "oklch(0.95 0.05 230 / 0.3)"
                        : "transparent",
                  }}
                >
                  <RadioGroupItem
                    value="male"
                    id="male"
                    className="border-ocean text-ocean"
                  />
                  <Label
                    htmlFor="male"
                    className="text-ocean cursor-pointer"
                  >
                    ชาย
                  </Label>
                </div>
                <div
                  className="flex items-center space-x-2 p-3 rounded-lg border border-sunset/20 hover:bg-sunset/5"
                  style={{
                    background:
                      profile.gender === "female"
                        ? "oklch(0.95 0.05 330 / 0.3)"
                        : "transparent",
                  }}
                >
                  <RadioGroupItem
                    value="female"
                    id="female"
                    className="border-sunset text-sunset"
                  />
                  <Label
                    htmlFor="female"
                    className="text-sunset cursor-pointer"
                  >
                    หญิง
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* อายุ น้ำหนัก ส่วนสูง */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="age"
                  className="text-deep-blue font-medium"
                >
                  อายุ (ปี)
                </Label>
                <Input
                  id="age"
                  type="number"
                  min="15"
                  max="100"
                  value={profile.age || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      age: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="25"
                  className="border-ocean/30 focus:border-ocean focus:ring-ocean/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="weight"
                  className="text-deep-blue font-medium"
                >
                  น้ำหนักปัจจุบัน (กก.)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  min="30"
                  max="200"
                  step="0.1"
                  value={profile.weight || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      weight: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="65"
                  className="border-sunset/30 focus:border-sunset focus:ring-sunset/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="height"
                  className="text-deep-blue font-medium"
                >
                  ส่วนสูง (ซม.)
                </Label>
                <Input
                  id="height"
                  type="number"
                  min="100"
                  max="250"
                  value={profile.height || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      height: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="170"
                  className="border-lavender/30 focus:border-lavender focus:ring-lavender/20"
                />
              </div>
            </div>

            {/* ระดับการออกกำลังกาย */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-deep-blue font-medium">
                <Activity className="h-4 w-4 text-sky" />
                ระดับการออกกำลังกาย
              </Label>
              <Select
                value={profile.activityLevel}
                onValueChange={(
                  value: UserProfile["activityLevel"],
                ) =>
                  setProfile((prev) => ({
                    ...prev,
                    activityLevel: value,
                  }))
                }
              >
                <SelectTrigger className="border-sky/30 focus:border-sky focus:ring-sky/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">
                    ไม่ค่อยออกกำลังกาย
                  </SelectItem>
                  <SelectItem value="light">
                    ออกกำลังกายเบา ๆ 1-3 วัน/สัปดาห์
                  </SelectItem>
                  <SelectItem value="moderate">
                    ออกกำลังกายปานกลาง 3-5 วัน/สัปดาห์
                  </SelectItem>
                  <SelectItem value="active">
                    ออกกำลังกายหนัก 6-7 วัน/สัปดาห์
                  </SelectItem>
                  <SelectItem value="very-active">
                    ออกกำลังกายหนักมาก วันละ 2 ครั้ง
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* เป้าหมาย */}
            <div className="space-y-4">
              <Label className="text-deep-blue font-medium">
                เป้าหมาย
              </Label>
              <RadioGroup
                value={profile.goal}
                onValueChange={handleGoalChange}
                className="grid grid-cols-1 gap-3"
              >
                <div
                  className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all"
                  style={{
                    borderColor:
                      profile.goal === "lose"
                        ? "oklch(0.65 0.2 320)"
                        : "oklch(0.9 0.01 240)",
                    background:
                      profile.goal === "lose"
                        ? "oklch(0.95 0.05 320 / 0.3)"
                        : "transparent",
                  }}
                >
                  <RadioGroupItem
                    value="lose"
                    id="lose-settings"
                    className="border-rose text-rose"
                  />
                  <Label
                    htmlFor="lose-settings"
                    className="cursor-pointer flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-rose" />
                      <span className="text-rose font-medium">
                        ลดน้ำหนัก
                      </span>
                    </div>
                  </Label>
                </div>
                <div
                  className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all"
                  style={{
                    borderColor:
                      profile.goal === "maintain"
                        ? "oklch(0.55 0.22 240)"
                        : "oklch(0.9 0.01 240)",
                    background:
                      profile.goal === "maintain"
                        ? "oklch(0.95 0.05 240 / 0.3)"
                        : "transparent",
                  }}
                >
                  <RadioGroupItem
                    value="maintain"
                    id="maintain-settings"
                    className="border-deep-blue text-deep-blue"
                  />
                  <Label
                    htmlFor="maintain-settings"
                    className="cursor-pointer flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-deep-blue" />
                      <span className="text-deep-blue font-medium">
                        รักษาน้ำหนัก
                      </span>
                    </div>
                  </Label>
                </div>
                <div
                  className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all"
                  style={{
                    borderColor:
                      profile.goal === "gain"
                        ? "oklch(0.6 0.2 230)"
                        : "oklch(0.9 0.01 240)",
                    background:
                      profile.goal === "gain"
                        ? "oklch(0.95 0.05 230 / 0.3)"
                        : "transparent",
                  }}
                >
                  <RadioGroupItem
                    value="gain"
                    id="gain-settings"
                    className="border-ocean text-ocean"
                  />
                  <Label
                    htmlFor="gain-settings"
                    className="cursor-pointer flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-ocean" />
                      <span className="text-ocean font-medium">
                        เพิ่มน้ำหนัก
                      </span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* ตั้งเป้าหมายเฉพาะ */}
              {profile.goal !== "maintain" && (
                <div
                  className="mt-4 p-4 rounded-lg space-y-4"
                  style={{
                    background: "oklch(0.98 0.04 280 / 0.3)",
                    border:
                      "1px solid oklch(0.9 0.08 280 / 0.3)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-lavender" />
                    <Label className="text-lavender font-medium">
                      ตั้งเป้าหมายเฉพาะ (ไม่บังคับ)
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="targetWeight-settings"
                        className="text-deep-blue font-medium"
                      >
                        น้ำหนักเป้าหมาย (กก.)
                      </Label>
                      <Input
                        id="targetWeight-settings"
                        type="number"
                        min="30"
                        max="200"
                        step="0.1"
                        value={profile.targetWeight || ""}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            targetWeight:
                              parseFloat(e.target.value) ||
                              undefined,
                          }))
                        }
                        placeholder={
                          profile.goal === "lose" ? "60" : "70"
                        }
                        className="border-lavender/30 focus:border-lavender focus:ring-lavender/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="timeframe-settings"
                        className="text-deep-blue font-medium"
                      >
                        ระยะเวลา (สัปดาห์)
                      </Label>
                      <Input
                        id="timeframe-settings"
                        type="number"
                        min="1"
                        max="52"
                        value={profile.timeframe || ""}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            timeframe:
                              parseInt(e.target.value) ||
                              undefined,
                          }))
                        }
                        placeholder="12"
                        className="border-sky/30 focus:border-sky focus:ring-sky/20"
                      />
                    </div>
                  </div>

                  {/* แสดงข้อมูลสรุปเป้าหมาย */}
                  {goalPreview && (
                    <div
                      className="mt-4 p-3 rounded border"
                      style={{
                        background:
                          goalPreview.weeklyChange > 1
                            ? "oklch(0.98 0.04 320 / 0.3)"
                            : "oklch(0.98 0.04 230 / 0.3)",
                        borderColor:
                          goalPreview.weeklyChange > 1
                            ? "oklch(0.65 0.2 320 / 0.3)"
                            : "oklch(0.6 0.2 230 / 0.3)",
                      }}
                    >
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>การเปลี่ยนแปลง:</span>
                          <span
                            className={
                              goalPreview.weeklyChange > 1
                                ? "text-rose font-medium"
                                : "text-ocean font-medium"
                            }
                          >
                            {formatWeight(
                              goalPreview.weightDifference,
                            )}{" "}
                            กก. ใน {goalPreview.timeframe}{" "}
                            สัปดาห์
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>ต่อสัปดาห์:</span>
                          <span
                            className={
                              goalPreview.weeklyChange > 1
                                ? "text-rose font-medium"
                                : "text-ocean font-medium"
                            }
                          >
                            {formatWeight(
                              goalPreview.weeklyChange,
                            )}{" "}
                            กก./สัปดาห์
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* คำแนะนำ */}
                  <Alert className="border-info/20 bg-info/10">
                    <Info className="h-4 w-4 text-info" />
                    <AlertDescription className="text-info">
                      หากไม่กรอก ระบบจะใช้ค่าเริ่มต้น 0.5
                      กก./สัปดาห์
                      ซึ่งเป็นอัตราที่ปลอดภัยและยั่งยืน
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* แสดงข้อผิดพลาด */}
              {!goalValidation.isValid && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {goalValidation.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={!isProfileValid}
              className="w-full text-white"
              style={{
                background: isProfileValid
                  ? "linear-gradient(135deg, oklch(0.75 0.18 330), oklch(0.6 0.2 230), oklch(0.7 0.15 280))"
                  : undefined,
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              บันทึกโปรไฟล์
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* การตั้งค่าอื่น ๆ */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">
            โซนอันตราย
          </CardTitle>
          <CardDescription>
            การกระทำเหล่านี้ไม่สามารถย้อนกลับได้
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div>
              <h4 className="text-destructive font-medium">
                ลบบัญชี
              </h4>
              <p className="text-sm text-muted-foreground">
                ลบบัญชีและข้อมูลทั้งหมดอย่างถาวร
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              ลบบัญชี
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}