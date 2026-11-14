import numpy as np, pymannkendall as mk
rng=np.random.default_rng(0)
t=np.arange(20*12)
season=3*np.sin(2*np.pi*t/12)
# Region A: rising 0.02/month + noise ; Region B: falling
A=season+0.02*t+rng.normal(0,1,t.size)
B=season-0.02*t+rng.normal(0,1,t.size)
C=season+0.002*t+rng.normal(0,2,t.size)  # weak, likely not significant
for name,x in [("A_rise",A),("B_fall",B),("C_weak",C)]:
    r=mk.original_test(x); s=mk.seasonal_test(x,period=12)
    print(name, "orig:",r.trend,round(r.p,4),"slope",round(r.slope,4),"| seasonal:",s.trend,round(s.p,4),"slope",round(s.slope,4), "| CI", round(s.intercept,2))
