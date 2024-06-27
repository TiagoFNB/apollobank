


#install necessary packages with install.packages function
install.packages("readr")
install.packages("ggplot2")
install.packages("ggpubr")
install.packages("nortest")

library(readr)
library(ggplot2)
library(ggpubr)
library(nortest)

#DATA IMPORT


resultsGraph10 <- read_csv("resultsGraph10.csv")   #SAMPLE SIZE - 140
resultsGraph100 <- read_csv("resultsGraph100.csv") #SAMPLE SIZE - 1400
resultsGraph500 <- read_csv("resultsGraph500.csv") #SAMPLE SIZE - 7000
#View(resultsGraph500)

resultsRel10 <- read_csv("resultsRel10.csv")
resultsRel100 <- read_csv("resultsRel100.csv")
resultsRel500 <- read_csv("resultsRel500.csv")
#View(resultsRel500)

resultsRel10 <- resultsRel10[order(resultsRel10$threadName),]  
resultsGraph10 <- resultsGraph10[order(resultsGraph10$threadName),]
resultsRel100 <- resultsRel100[order(resultsRel100$threadName),]  
resultsGraph100 <- resultsGraph100[order(resultsGraph100$threadName),]
resultsRel500 <- resultsRel500[order(resultsRel500$threadName),]  
resultsGraph500 <- resultsGraph500[order(resultsGraph500$threadName),]

View(resultsRel500)
View(resultsGraph500 )

TimesGraph10<- resultsGraph10$elapsed
TimesRel10<- resultsRel10$elapsed
TimesGraph100<- resultsGraph100$elapsed
TimesRel100<- resultsRel100$elapsed
TimesGraph500<- resultsGraph500$elapsed
TimesRel500<- resultsRel500$elapsed

#AVERAGE TIME

#10 Concurrent Users

avgTimeGraph10<-mean(TimesGraph10) #65.55714
avgTimeGraph10
avgTimeRel10<-mean(TimesRel10) #60.97143
avgTimeRel10

#On average relational is around 22ms faster than graph with 10 concurrent users

#100 Concurrent Users

avgTimeGraph100<-mean(TimesGraph100) #144.9743
avgTimeGraph100
avgTimeRel100<-mean(TimesRel100) #101.7486
avgTimeRel100

#On average relational is around 43ms faster than graph with 100 concurrent users

#500 Concurrent Users

avgTimeGraph500<-mean(TimesGraph500) #171.0226
avgTimeGraph500
avgTimeRel500<-mean(TimesRel500) #282.584
avgTimeRel500

#On average graph is around 110ms faster than relational with 500 concurrent users

#Conclusion: With small user counts relational as slight advantage, but graph becomes preferable if user count is bigger.

# MAX, MIN, MEDIAN


max(TimesGraph10)  # 406
max(TimesRel10)    # 949

max(TimesGraph100) # 829
max(TimesRel100)   # 808

max(TimesGraph500) # 1228
max(TimesRel500)   # 2249

min(TimesGraph10)  # 9
min(TimesRel10)    # 5

min(TimesGraph100) # 9
min(TimesRel100)   # 4

min(TimesGraph500) # 7
min(TimesRel500)   # 4

median(TimesGraph10)  # 41.5
median(TimesRel10)    # 10

median(TimesGraph100) # 57
median(TimesRel100)   # 22

median(TimesGraph500) # 70
median(TimesRel500)   # 50

#Conclusion: 
# In terms of max times, graph clearly is better performer, except in the 100 users case.
# In min times, relational better performer, but difference is very small
# In median, the backend with relational shows better results than with graph.

#HYPOTHESIS TESTING
#Level of significance 0.05

# VOLUME TEST - 10

#Normality test
#Null hypothesis (H0): Data is normally distributed.
#Alternative hyphothesis (H1): Data is not normally distributed.
#Sample size is small - 140, so shapiro test is used

shapiro.test(TimesGraph10 - TimesRel10) # p_value < 0.05

# Both p_values are less than 0.05, so the null hypothesis is rejected, data is not normally distributed.

#Null hypothesis (H0): There are no variations in response times.
#Alternative hyphothesis (H1): There are variations in response times.
wilcox.test(TimesGraph10,TimesRel10, paired=TRUE)

#6.158e-12
#p_value < 0.05, then null hypothesis is rejected, there are variations in response times.

library(ggpubr)
ggqqplot(TimesGraph10 - TimesRel10, ylab = "Sample", xlab = "Theoretical")


# VOLUME TEST - 100

#Normality test
#Null hypothesis (H0): Data is normally distributed.
#Alternative hyphothesis (H1): Data is not normally distributed.
#Sample size is medium - 1400, so shapiro test is used

shapiro.test(TimesGraph100 - TimesRel100) # p_value < 0.05

# Both p_values are less than 0.05, so the null hypothesis is rejected, data is not normally distributed.

#Null hypothesis (H0): There are no variations in response times.
#Alternative hyphothesis (H1): There are variations in response times.
wilcox.test(TimesGraph100,TimesRel100, paired=TRUE)

#p_value < 0.05, then null hypothesis is rejected, there are variations in response times.

library("ggqplot")
ggqqplot(TimesGraph100, ylab = "Graph times")
ggqqplot(TimesRel100, ylab = "Rel times")

# VOLUME TEST - 500

#Normality test
#Null hypothesis (H0): Data is normally distributed.
#Alternative hyphothesis (H1): Data is not normally distributed.
#Sample size is big - 7000, so AD test is used


ad.test(TimesGraph500 - TimesRel500) # p_value < 0.05

# Both p_values are less than 0.05, so the null hypothesis is rejected, data is not normally distributed.

#Null hypothesis (H0): There are no variations in response times.
#Alternative hyphothesis (H1): There are variations in response times.
wilcox.test(TimesGraph500,TimesRel500, paired=TRUE)
#9.875206e-25
#p_value < 0.05, then null hypothesis is rejected, there are variations in response times.

ggqqplot(TimesGraph500, ylab = "Graph times")
ggqqplot(TimesRel500, ylab = "Relational times")



#GRÁFICO DE BARRAS

cats <- c("Graph\n10 users", "Relational\n10 users","Graph\n100 users", "Relational\n100 users","Graph\n500 users", "Relational\n500users")
colors <- c("blue", "orange","blue", "orange","blue", "orange")

#Average
avgs <- c(avgTimeGraph10, avgTimeRel10,avgTimeGraph100, avgTimeRel100,avgTimeGraph500, avgTimeRel500)
grafico <- barplot(avgs, names.arg = cats, xlab = "Test cases", ylab = "Average response time (ms)", col = colors,ylim = c(0, max(avgs) + 100))

#Throughtput
tps <- c(344.8, 147.5, 1688.8, 1732.7, 5700.3, 3112.5)
grafico <- barplot(tps , names.arg = cats, xlab = "Test cases", ylab = "Throughput ( Requests /s )", col = colors,ylim = c(0, max(tps) + 500))











