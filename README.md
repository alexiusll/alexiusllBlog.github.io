# alexiusll的个人博客
我的个人博客



## 🎈实现方式

- 博客搭建 Hexo

- 主题 Next

- 评论功能，点击显示 valine

- 自动化部署 Travis CI

- 各种Hexo的插件 （具体看package.json 和next的配置文件)

  

## 📋 基础使用

**安装项目依赖:**

```bash
$ yarn
```

**开启 dev 服务器:**

```bash
$ yarn deploy
```

**构建:**

```bash
$ yarn build
```

**清理缓存文件:**

```bash
$ yarn clean
```

**新建博文: （需要npm或yarn全局安装 hexo)**

```bash
$ hexo add <文章名>
```



更多指令请参考 Hexo文档

并且全局安装 Hexo来执行



## 📗已经实现的功能

- 写博文，博文分类，归档，标签 （基于Hexo）
- 评论 （基于valine）
- 显示 阅读次数 （基于valine）
- 百度统计接入 （似乎也没什么用..可以考虑删了）
- 显示文章字数和大致阅读时间
- 修改 Next 的原生样式



## 🔵TODO...

- 优化部署速度
- 完善对样式的修改，美化博客

