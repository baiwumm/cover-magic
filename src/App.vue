<template>
  <!-- 加载动画 -->
  <LoadingScreen v-if="isLoading" />
  <n-config-provider v-else :theme="theme">
    <n-message-provider>
      <div
        class="min-h-screen"
        :class="[
          isDarkMode
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark-mode'
            : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50',
        ]"
      >
        <!-- 顶部标题栏 -->
        <HeaderPanel
          :title="siteInfo.name"
          :subtitle="siteInfo.description"
          @header-action="handleHeaderAction"
          @theme-change="handleThemeChange"
        />

        <div class="container mx-auto px-6 mt-8">
          <!-- 预览区域 -->
          <div
            :class="
              isDarkMode
                ? 'bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50'
                : 'bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50'
            "
          >
            <!-- 预览区域标题和操作按钮 - 在小屏幕上改为垂直排列 -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <h2
                class="text-xl font-bold flex items-center gap-1"
                :class="isDarkMode ? 'text-gray-100' : 'text-gray-800'"
              >
                <Icon
                  icon="material-symbols:preview"
                  class="text-2xl"
                  :class="isDarkMode ? 'text-blue-400' : 'text-blue-600'"
                />
                实时预览
              </h2>
              <div class="flex flex-wrap items-center gap-2">
                <!-- 全局操作按钮 - 移到预览区域标题栏 -->
                <n-button
                  size="small"
                  type="info"
                  secondary
                  class="flex items-center gap-1"
                  :class="isDarkMode ? 'hover:bg-cyan-700/50' : 'hover:bg-cyan-100'"
                  @click="openThemeSelector"
                >
                  <Icon icon="material-symbols:palette-outline" />
                  主题选择
                </n-button>
                <n-button
                  size="small"
                  type="primary"
                  secondary
                  class="flex items-center gap-1"
                  :class="isDarkMode ? 'hover:bg-blue-700/50' : 'hover:bg-blue-100'"
                  @click="saveCurrentConfig"
                >
                  <Icon icon="material-symbols:save-outline" />
                  保存配置
                </n-button>
                <n-button
                  size="small"
                  type="warning"
                  secondary
                  class="flex items-center gap-1"
                  :class="isDarkMode ? 'hover:bg-amber-700/50' : 'hover:bg-amber-100'"
                  @click="showResetConfirm = true"
                >
                  <Icon icon="material-symbols:restart-alt" />
                  重置配置
                </n-button>
              </div>
            </div>
            <n-grid :x-gap="16" :y-gap="24" cols="1 s:1 m:1 l:5 xl:5 2xl:5" responsive="screen">
              <!-- 操作面板 - 大屏幕左侧，小屏幕下方 -->
              <n-gi span="24 m:24 l:2" class="order-2 lg:order-1">
                <n-tabs type="segment" animated size="small" :tabs-padding="8">
                  <n-tab-pane name="background-panel">
                    <template #tab>
                      <div class="flex items-center gap-0.5 min-w-0">
                        <Icon icon="material-symbols:image" class="text-lg text-purple-600 flex-shrink-0" />
                        <span class="font-medium text-sm truncate hidden sm:inline">背景设置</span>
                        <span class="font-medium text-sm truncate sm:hidden">背景</span>
                      </div>
                    </template>
                    <BackgroundPanel
                      :backgroundConfig="backgroundConfig"
                      @update:backgroundConfig="
                        (newBackgroundConfig) => {
                          Object.assign(backgroundConfig, newBackgroundConfig);
                          updateCanvas();
                        }
                      "
                      @image-upload="handleImageUpload"
                      @canvas-update="updateCanvas"
                    />
                  </n-tab-pane>

                  <n-tab-pane name="icon-panel">
                    <template #tab>
                      <div class="flex items-center gap-0.5 min-w-0">
                        <Icon icon="material-symbols:star" class="text-lg text-yellow-600 flex-shrink-0" />
                        <span class="font-medium text-sm truncate hidden sm:inline">图标设置</span>
                        <span class="font-medium text-sm truncate sm:hidden">图标</span>
                      </div>
                    </template>
                    <IconPanel
                      :iconConfig="iconConfig"
                      @update:iconConfig="
                        (newIconConfig) => {
                          Object.assign(iconConfig, newIconConfig);
                          updateCanvas();
                        }
                      "
                      @icon-load="loadIcon"
                      @canvas-update="updateCanvas"
                    />
                  </n-tab-pane>

                  <n-tab-pane name="title-panel">
                    <template #tab>
                      <div class="flex items-center gap-0.5 min-w-0">
                        <Icon icon="material-symbols:title" class="text-lg text-green-600 flex-shrink-0" />
                        <span class="font-medium text-sm truncate hidden sm:inline">标题设置</span>
                        <span class="font-medium text-sm truncate sm:hidden">标题</span>
                      </div>
                    </template>
                    <TitlePanel
                      :titleConfig="titleConfig"
                      @update:titleConfig="
                        (newTitleConfig) => {
                          Object.assign(titleConfig, newTitleConfig);
                          updateCanvas();
                        }
                      "
                      @canvas-update="updateCanvas"
                    />
                  </n-tab-pane>

                  <n-tab-pane name="watermark-panel">
                    <template #tab>
                      <div class="flex items-center gap-0.5 min-w-0">
                        <Icon icon="material-symbols:water-drop" class="text-lg text-blue-500 flex-shrink-0" />
                        <span class="font-medium text-sm truncate hidden sm:inline">水印设置</span>
                        <span class="font-medium text-sm truncate sm:hidden">水印</span>
                      </div>
                    </template>
                    <WatermarkPanel
                      :watermarkConfig="watermarkConfig"
                      @update:watermarkConfig="
                        (newWatermarkConfig) => {
                          Object.assign(watermarkConfig, newWatermarkConfig);
                          updateCanvas();
                        }
                      "
                      @canvas-update="updateCanvas"
                    />
                  </n-tab-pane>

                  <n-tab-pane name="export-panel">
                    <template #tab>
                      <div class="flex items-center gap-0.5 min-w-0">
                        <Icon icon="material-symbols:download" class="text-lg text-blue-600 flex-shrink-0" />
                        <span class="font-medium text-sm truncate hidden sm:inline">导出设置</span>
                        <span class="font-medium text-sm truncate sm:hidden">导出</span>
                      </div>
                    </template>
                    <ExportPanel
                      :exportConfig="exportConfig"
                      @update:exportConfig="
                        (newExportConfig) => {
                          Object.assign(exportConfig, newExportConfig);
                        }
                      "
                      @export-image="exportImage"
                    />
                  </n-tab-pane>
                </n-tabs>
              </n-gi>
              <!-- 预览区域 - 大屏幕右侧，小屏幕上方 -->
              <n-gi span="24 m:24 l:3" class="order-1 lg:order-2">
                <DefaultTheme
                  ref="defaultThemeRef"
                  :backgroundConfig="backgroundConfig"
                  :iconConfig="iconConfig"
                  :titleConfig="titleConfig"
                  :watermarkConfig="watermarkConfig"
                  @canvas-update="onCanvasUpdate"
                />
              </n-gi>
            </n-grid>
          </div>
        </div>

        <!-- 底部版权信息 -->
        <FooterPanel />
      </div>
    </n-message-provider>
  </n-config-provider>
  <github-corner />

  <!-- 重置确认对话框 -->
  <n-modal v-model:show="showResetConfirm" preset="dialog" title="确认重置">
    <template #header>
      <div class="flex items-center gap-2">
        <Icon icon="material-symbols:warning-outline" class="text-2xl text-yellow-500" />
        <span class="text-lg font-bold">确认重置</span>
      </div>
    </template>
    <div>确定要重置所有配置吗？此操作将恢复所有设置为默认值，且无法撤销。</div>
    <template #action>
      <div class="flex justify-end gap-2">
        <n-button @click="showResetConfirm = false">取消</n-button>
        <n-button type="warning" @click="resetAllConfig">确认重置</n-button>
      </div>
    </template>
  </n-modal>

  <!-- 主题选择器组件 -->
  <ThemeSelector ref="themeSelectorRef" @theme-selected="applyTheme" />
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useHead } from "@unhead/vue";
import { inject } from "@vercel/analytics";
import {
  NGrid,
  NGi,
  NConfigProvider,
  darkTheme,
  NButton,
  NModal,
  createDiscreteApi,
  type GlobalTheme,
  NTabs,
  NTabPane,
  NMessageProvider,
} from "naive-ui";
import { ref, reactive, onMounted, nextTick } from "vue";

import type { BackgroundConfig, IconConfig, TitleConfig, WatermarkConfig, ExportConfig } from "@/lib/type";

import BackgroundPanel from "@/components/BackgroundPanel.vue"; // 背景设置面板
import DefaultTheme from "@/components/DefaultTheme.vue"; // 默认主题组件
import ExportPanel from "@/components/ExportPanel.vue"; // 导出设置面板
import FooterPanel from "@/components/FooterPanel.vue"; // 底部版权信息
import GithubCorner from "@/components/GithubCorner.vue"; // GitHub 图标
import HeaderPanel from "@/components/HeaderPanel.vue"; // 页面顶部信息面板
import IconPanel from "@/components/IconPanel.vue"; // 图标设置面板
import LoadingScreen from "@/components/LoadingScreen.vue"; // 页面加载进度条
import ThemeSelector from "@/components/ThemeSelector.vue"; // 主题选择器组件
import TitlePanel from "@/components/TitlePanel.vue"; // 标题设置面板
import WatermarkPanel from "@/components/WatermarkPanel.vue"; // 水印设置面板
import { BACKGROUND_TYPE, GRADIENT_DIRECTION } from "@/lib/constant";

// 加载状态
const isLoading = ref(true);

// 重置确认对话框
const showResetConfirm = ref(false);

// 创建独立的消息 API
const { message } = createDiscreteApi(["message"]);

// 站点信息
const siteInfo = reactive({
  name: import.meta.env.VITE_APP_SITE_NAME,
  description: import.meta.env.VITE_APP_SITE_DESCRIPTION,
});

// 页面元数据
useHead({
  title: `${import.meta.env.VITE_APP_SITE_NAME} - ${import.meta.env.VITE_APP_SITE_DESCRIPTION}`,
  meta: [
    { name: "description", content: import.meta.env.VITE_APP_SITE_DESCRIPTION },
    {
      name: "keywords",
      content: import.meta.env.VITE_APP_SITE_KEYWORDS,
    },
  ],
  link: [
    {
      rel: "icon",
      type: "image/x-icon",
      href: "/favicon.ico", // 路径指向 public/favicon.ico
    },
  ],
});

// 背景设置 - 用于控制封面背景的各项属性
const backgroundConfig = reactive<BackgroundConfig>({
  type: BACKGROUND_TYPE.COLOR, // 背景类型：'color'表示纯色背景，'image'表示图片背景，'gradient'表示渐变背景
  color: "#000000", // 背景颜色：十六进制颜色值，默认为黑色
  opacity: 100, // 背景不透明度：范围0-100，100表示完全不透明
  image: "" as string, // 背景图片：Base64格式的图片数据URL字符串
  imageObj: null as HTMLImageElement | null, // 背景图片对象：用于Canvas绘制的图片DOM元素
  blur: 0, // 背景模糊度：应用于图片背景的模糊效果，单位为像素
  gradient: {
    // 渐变背景配置
    startColor: "#3b82f6", // 起始颜色：默认为蓝色
    endColor: "#8b5cf6", // 结束颜色：默认为紫色
    direction: GRADIENT_DIRECTION.TO_BOTTOM_RIGHT, // 渐变方向：默认为左上到右下
  },
});

// 图标设置 - 用于控制封面中心图标的各项属性
const iconConfig = reactive<IconConfig>({
  code: "fluent-emoji-flat:four-leaf-clover", // 图标代码：使用Iconify图标库的标识符，指定要显示的图标
  size: 240, // 图标大小：控制图标的显示尺寸，单位为像素
  shadowSize: 100, // 阴影大小：控制图标阴影的模糊半径，值越大阴影越模糊扩散
  shadowColor: "#ffffff", // 阴影颜色：指定图标阴影的颜色，默认为白色
  position: {
    // 图标位置：控制图标在画布中的位置
    x: 50, // 水平位置：以百分比表示，50表示水平居中
    y: 50, // 垂直位置：以百分比表示，50表示垂直居中
  },
  svg: "", // 图标SVG内容：存储从Iconify API获取的SVG代码，用于在Canvas中渲染图标
});

// 标题设置 - 用于控制封面标题文本的各项属性
const titleConfig = reactive<TitleConfig>({
  text: "封面   制作", // 标题文本：显示在封面上的文字内容
  font: "Maple Mono CN", // 字体名称：指定标题文本使用的字体
  size: 180, // 字体大小：控制标题文本的显示尺寸，单位为像素
  color: "#ffffff", // 字体颜色：指定标题文本的颜色，默认为白色
  position: {
    // 标题位置：控制标题在画布中的位置
    x: 50, // 水平位置：以百分比表示，50表示水平居中
    y: 50, // 垂直位置：以百分比表示，50表示垂直居中
  },
  effects: {
    // 文本效果：控制标题文本的样式效果
    bold: true, // 粗体：true表示使用粗体，false表示不使用
    italic: false, // 斜体：true表示使用斜体，false表示不使用
    uppercase: false, // 大写：true表示将英文转换为大写，false表示不转换
    textShadow: 0, // 立体字效果：控制文字阴影深度，范围0-10，0表示无立体效果
  },
});

// 水印设置 - 用于控制封面水印的各项属性
const watermarkConfig = reactive<WatermarkConfig>({
  text: "@baiwumm", // 水印文本：显示在封面上的水印内容
  font: "Maple Mono CN", // 字体名称：指定水印文本使用的字体
  size: 50, // 字体大小：控制水印文本的显示尺寸，单位为像素
  color: "#ffffff", // 字体颜色：指定水印文本的颜色，默认为白色
  opacity: 80, // 不透明度：控制水印的透明度，范围0-100，100表示完全不透明
  position: {
    // 水印位置：控制水印在画布中的位置
    x: 98, // 水平位置：以百分比表示，90表示靠右
    y: 98, // 垂直位置：以百分比表示，95表示靠下
  },
  effects: {
    // 文本效果：控制水印文本的样式效果
    bold: true, // 粗体：true表示使用粗体，false表示不使用
    italic: true, // 斜体：true表示使用斜体，false表示不使用
    uppercase: false, // 大写：true表示将英文转换为大写，false表示不转换
    textShadow: 0, // 立体字效果：控制文字阴影深度，范围0-10，0表示无立体效果
  },
});

// 导出设置 - 用于控制导出图片的各项属性
const exportConfig = reactive<ExportConfig>({
  width: 1920, // 导出宽度：导出图片的宽度，单位为像素
  height: 1080, // 导出高度：导出图片的高度，单位为像素
  format: "webp", // 导出格式：支持'png'、'jpeg'、'webp'等格式
  fileName: "封面设计", // 文件名：导出图片的文件名
  useRandomFileName: true, // 是否使用随机文件名：true表示使用随机生成的文件名
  randomFileNameLength: 32, // 随机文件名长度：随机生成的文件名的字符数
  randomFileNameOptions: {
    // 随机文件名选项：控制随机文件名包含的字符类型
    includeNumbers: true, // 是否包含数字：true表示包含数字
    includeLowercase: true, // 是否包含小写字母：true表示包含小写字母
    includeUppercase: true, // 是否包含大写字母：true表示包含大写字母
  },
  currentRandomFileName: "", // 当前随机文件名：当前生成的随机文件名
  quality: 0.9, // 图片质量：范围0.1-1.0，默认0.9，在保持较高质量的同时有效减小文件体积
});

// 预览面板引用
const defaultThemeRef = ref<InstanceType<typeof DefaultTheme> | null>(null);
// 主题选择器引用
const themeSelectorRef = ref<InstanceType<typeof ThemeSelector> | null>(null);

// 定义主题配置类型
interface ThemeConfig {
  background?: Partial<BackgroundConfig>;
  icon?: Partial<Omit<IconConfig, "svg">>;
  title?: Partial<TitleConfig>;
  watermark?: Partial<WatermarkConfig>;
}

// 加载图标
const loadIcon = async () => {
  return new Promise<void>((resolve) => {
    if (!iconConfig.code) {
      iconConfig.svg = "";
      resolve();
      return;
    }

    try {
      // 从 Iconify API 获取 SVG
      fetch(`https://api.iconify.design/${iconConfig.code}.svg`)
        .then((response) => {
          if (response.ok) {
            return response.text();
          } else {
            return "";
          }
        })
        .then((svg) => {
          iconConfig.svg = svg;
          resolve();
        })
        .catch((error) => {
          console.error("加载图标失败:", error);
          iconConfig.svg = "";
          resolve();
        });
    } catch (error) {
      console.error("加载图标失败:", error);
      iconConfig.svg = "";
      resolve();
    }
  });
};

// 处理图片上传
const handleImageUpload = (options: any) => {
  const file = options.file.file;
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // 创建新的对象引用更新背景对象，确保响应式更新
        backgroundConfig.image = imageDataUrl;
        backgroundConfig.imageObj = img;
        updateCanvas();
      };
      img.src = imageDataUrl;
    };
    reader.readAsDataURL(file);
  }
};

// 更新画布 - 公共入口点
const updateCanvas = () => {
  if (defaultThemeRef.value) {
    defaultThemeRef.value.updateCanvas();
  }
};

// 画布更新事件处理
const onCanvasUpdate = () => {
  // 可以在这里添加额外的处理逻辑
};

// 导出图片
const exportImage = async () => {
  // 调用预览面板的导出方法
  if (defaultThemeRef.value) {
    defaultThemeRef.value.exportImage(exportConfig);
  }
};

// 暗黑主题状态
const isDarkMode = ref(false);
const theme = ref<GlobalTheme | null>(null);

// 处理头部面板的操作事件
const handleHeaderAction = (action: string) => {
  console.log("头部操作:", action);
  // 可以根据不同的操作执行相应的逻辑
  // 例如：打开帮助文档、显示关于信息等
};

// 处理主题切换
const handleThemeChange = (isDark: boolean) => {
  isDarkMode.value = isDark;
  theme.value = isDark ? darkTheme : null;
};

// 打开主题选择器
const openThemeSelector = () => {
  if (themeSelectorRef.value) {
    themeSelectorRef.value.openThemeSelector();
  }
};

// 应用选择的主题
const applyTheme = (themeConfig: ThemeConfig) => {
  // 应用背景配置
  if (themeConfig.background) {
    Object.assign(backgroundConfig, themeConfig.background);
    // 如果是图片背景且有图片，需要重新加载图片对象
    if (backgroundConfig.type === "image" && backgroundConfig.image) {
      const img = new Image();
      img.onload = () => {
        backgroundConfig.imageObj = img;
        updateCanvas();
      };
      img.src = backgroundConfig.image;
    }
  }

  // 应用图标配置
  if (themeConfig.icon) {
    Object.assign(iconConfig, themeConfig.icon);
    // 重新加载图标SVG
    if (iconConfig.code) {
      loadIcon().then(() => updateCanvas());
    }
  }

  // 应用标题配置
  if (themeConfig.title) {
    Object.assign(titleConfig, themeConfig.title);
  }

  // 应用水印配置
  if (themeConfig.watermark) {
    Object.assign(watermarkConfig, themeConfig.watermark);
  }

  // 更新画布
  nextTick(() => {
    updateCanvas();
    message.success("主题应用成功");
  });
};

// 检查字体是否加载完成
const checkFontsLoaded = async () => {
  return new Promise<void>((resolve) => {
    // 检查标题和水印使用的字体
    const fonts = [titleConfig.font, watermarkConfig.font].filter(Boolean);

    if (fonts.length === 0) {
      resolve();
      return;
    }

    // 使用FontFaceObserver检查字体加载
    if ("FontFace" in window) {
      // 如果浏览器支持FontFace API，使用document.fonts.ready
      document.fonts.ready
        .then(() => {
          resolve();
        })
        .catch(() => {
          // 即使字体加载失败，也继续初始化应用
          console.warn("字体加载失败，使用后备字体");
          resolve();
        });
    } else {
      // 如果不支持，直接继续
      resolve();
    }
  });
};

// 初始化应用
const initializeApp = async () => {
  try {
    // 模拟一些初始化时间，确保加载动画能够显示
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 并行加载资源
    await Promise.all([
      // 加载初始图标
      iconConfig.code ? loadIcon() : Promise.resolve(),
      // 检查字体加载
      checkFontsLoaded(),
    ]);

    // 所有资源加载完成后，添加短暂延迟以完成加载动画
    setTimeout(() => {
      isLoading.value = false;

      // 初始化画布
      nextTick(() => {
        updateCanvas();
      });
    }, 500);
  } catch (error) {
    console.error("初始化应用失败:", error);
    // 即使出错，也隐藏加载动画并尝试初始化
    setTimeout(() => {
      isLoading.value = false;
      nextTick(() => {
        updateCanvas();
      });
    }, 500);
  }
};

// 保存当前配置到本地存储
const saveCurrentConfig = () => {
  try {
    // 创建配置对象
    const config = {
      background: { ...backgroundConfig },
      icon: {
        ...iconConfig,
        svg: undefined, // 不保存SVG内容，避免存储过大
      },
      title: { ...titleConfig },
      watermark: { ...watermarkConfig },
      export: { ...exportConfig },
      theme: isDarkMode.value ? "dark" : "light",
      // 保存当前主题ID，如果有的话
      themeId: themeSelectorRef.value?.selectedThemeId || "default",
    };

    // 移除图片对象引用，因为它不能被序列化
    if (config.background.imageObj) {
      config.background.imageObj = null;
    }

    // 保存到本地存储
    localStorage.setItem("cover-magic-config", JSON.stringify(config));

    // 显示成功消息
    message.success("配置已保存");
  } catch (error) {
    console.error("保存配置失败:", error);
    message.error("保存配置失败");
  }
};

// 加载保存的配置
const loadSavedConfig = () => {
  try {
    const savedConfig = localStorage.getItem("cover-magic-config");
    if (savedConfig) {
      const config = JSON.parse(savedConfig);

      // 恢复背景配置
      if (config.background) {
        Object.assign(backgroundConfig, config.background);
        // 如果有图片，需要重新加载图片对象
        if (backgroundConfig.image) {
          const img = new Image();
          img.onload = () => {
            backgroundConfig.imageObj = img;
            updateCanvas();
          };
          img.src = backgroundConfig.image;
        }
      }

      // 恢复图标配置
      if (config.icon) {
        Object.assign(iconConfig, config.icon);
        // 重新加载图标SVG
        if (iconConfig.code) {
          loadIcon();
        }
      }

      // 恢复标题配置
      if (config.title) {
        Object.assign(titleConfig, config.title);
      }

      // 恢复水印配置
      if (config.watermark) {
        Object.assign(watermarkConfig, config.watermark);
      }

      // 恢复导出配置
      if (config.export) {
        Object.assign(exportConfig, config.export);
      }

      // 恢复主题
      if (config.theme) {
        const isDark = config.theme === "dark";
        isDarkMode.value = isDark;
        theme.value = isDark ? darkTheme : null;
      }

      // 恢复主题ID（如果有）
      if (config.themeId && themeSelectorRef.value) {
        nextTick(() => {
          if (themeSelectorRef.value) {
            themeSelectorRef.value.selectedThemeId = config.themeId;
          }
        });
      }

      // 更新画布
      nextTick(() => {
        updateCanvas();
      });
    }
  } catch (error) {
    console.error("加载配置失败:", error);
    message.error("加载配置失败");
  }
};

// 重置所有配置
const resetAllConfig = () => {
  try {
    // 重置背景配置
    Object.assign(backgroundConfig, {
      type: BACKGROUND_TYPE.COLOR,
      color: "#000000",
      opacity: 100,
      image: "",
      imageObj: null,
      blur: 0,
      gradient: {
        startColor: "#3b82f6",
        endColor: "#8b5cf6",
        direction: GRADIENT_DIRECTION.TO_BOTTOM_RIGHT,
      },
    });

    // 重置图标配置
    Object.assign(iconConfig, {
      code: "fluent-emoji-flat:four-leaf-clover",
      size: 240,
      shadowSize: 100,
      shadowColor: "#ffffff",
      position: {
        x: 50,
        y: 50,
      },
      svg: "",
    });

    // 重新加载图标
    loadIcon();

    // 重置标题配置
    Object.assign(titleConfig, {
      text: "封面   制作",
      font: "Maple Mono CN",
      size: 180,
      color: "#ffffff",
      position: {
        x: 50,
        y: 50,
      },
      effects: {
        bold: true,
        italic: false,
        uppercase: false,
        textShadow: 0,
      },
    });

    // 重置水印配置
    Object.assign(watermarkConfig, {
      text: "@baiwumm",
      font: "Maple Mono CN",
      size: 50,
      color: "#ffffff",
      opacity: 80,
      position: {
        x: 98,
        y: 98,
      },
      effects: {
        bold: true,
        italic: true,
        uppercase: false,
      },
    });

    // 重置导出配置
    Object.assign(exportConfig, {
      width: 1920,
      height: 1080,
      format: "webp",
      fileName: "封面设计",
      useRandomFileName: true,
      randomFileNameLength: 32,
      randomFileNameOptions: {
        includeNumbers: true,
        includeLowercase: true,
        includeUppercase: true,
      },
      currentRandomFileName: "",
    });

    // 更新画布
    nextTick(() => {
      updateCanvas();
    });

    // 关闭确认对话框
    showResetConfirm.value = false;

    // 显示成功消息
    message.success("已重置所有配置");
  } catch (error) {
    console.error("重置配置失败:", error);
    message.error("重置配置失败");
  }
};

// 组件挂载时初始化
onMounted(() => {
  // 如果页面已经加载完成，直接初始化应用
  if (document.readyState === "complete") {
    initializeApp();
  } else {
    // 否则等待页面资源加载完成
    window.addEventListener("load", initializeApp);
  }

  // 加载保存的配置
  loadSavedConfig();

  // 初始化 Vercel 统计代码
  inject();
});
</script>
